export const runtime = 'edge'
export const preferredRegion = 'syd1'
export const dynamic = 'force-dynamic'

// Minimal type to satisfy TS in Edge runtime
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
declare const WebSocketPair: { new (): [WebSocket, WebSocket] }

type Role = 'host' | 'player'

type PlayerSocket = WebSocket & { __playerId?: string }

type Session = {
  host?: WebSocket
  players: Set<PlayerSocket>
}

// In-memory session registry (best-effort; ephemeral in Edge runtime)
const sessions: Map<string, Session> = new Map()

function getOrCreateSession(id: string): Session {
  let s = sessions.get(id)
  if (!s) {
    s = { players: new Set() }
    sessions.set(id, s)
  }
  return s
}

export async function GET(req: Request, ctx: { params: Promise<{ session: string }> }) {
  const { session } = await ctx.params
  const url = new URL(req.url)
  const role = (url.searchParams.get('role') || 'player') as Role
  const playerId = url.searchParams.get('playerId') || undefined

  const pair = new WebSocketPair()
  const client = pair[0]
  const server = pair[1] as PlayerSocket

  const s = getOrCreateSession(session)

  ;(server as any).accept()
  try { console.log('[ws] connect', { session, role, playerId }) } catch {}

  // Periodic heartbeat to keep connections alive
  const keepAlive = setInterval(() => {
    try { server.send(JSON.stringify({ type: 'ping' })) } catch {}
  }, 25000)

  if (role === 'host') {
    // Register host; replace any existing
    if (s.host && (s.host as any).readyState === 1) {
      try { s.host.close(1012, 'Replaced by new host') } catch {}
    }
    s.host = server

    // Inform host about current players
    queueMicrotask(() => {
      try {
        const players = Array.from(s.players).map(p => p.__playerId || 'unknown')
        server.send(JSON.stringify({ type: 'ready', players }))
      } catch {}
    })
  } else {
    // Register player
    server.__playerId = playerId
    s.players.add(server)
    // Notify host of new player
    if (s.host && (s.host as any).readyState === 1) {
      try { s.host.send(JSON.stringify({ type: 'player-join', playerId })) } catch {}
    }
  }

  server.addEventListener('message', (event: MessageEvent) => {
    const raw = event.data
    let data: any
    try { data = typeof raw === 'string' ? JSON.parse(raw) : raw } catch { return }
    // Relay player inputs to host
    if (role === 'player' && data && s.host && (s.host as any).readyState === 1) {
      try {
        s.host.send(JSON.stringify({ type: 'input', playerId, input: data }))
      } catch {}
      return
    }
    // Optionally relay host messages back to a specific player
    if (role === 'host' && data && data.type === 'to-player') {
      const target = Array.from(s.players).find(p => (p.__playerId || undefined) === data.playerId)
      if (target && (target as any).readyState === 1) {
        try { target.send(JSON.stringify(data.payload)) } catch {}
      }
      return
    }
  })

  const cleanup = () => {
    try { console.log('[ws] close', { session, role, playerId }) } catch {}
    clearInterval(keepAlive)
    if (role === 'host') {
      if (s.host === server) s.host = undefined
      // Inform players host went away (optional)
      for (const p of s.players) {
        try { p.send(JSON.stringify({ type: 'host-close' })) } catch {}
      }
    } else {
      s.players.delete(server)
      if (s.host && (s.host as any).readyState === 1) {
        try { s.host.send(JSON.stringify({ type: 'player-leave', playerId })) } catch {}
      }
    }
    // Attempt session GC
    if (!s.host && s.players.size === 0) {
      sessions.delete(session)
    }
  }

  server.addEventListener('close', cleanup)
  server.addEventListener('error', cleanup as any)

  return new Response(null, { status: 101, webSocket: client } as any)
}
