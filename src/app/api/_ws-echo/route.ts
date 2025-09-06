export const runtime = 'edge'
export const dynamic = 'force-dynamic'

// Minimal type declaration for Edge WebSocketPair in TS
declare const WebSocketPair: { new (): [WebSocket, WebSocket] }

export async function GET(req: Request) {
  const upgrade = req.headers.get('upgrade') || ''
  if (upgrade.toLowerCase() !== 'websocket') {
    return new Response('Expected websocket upgrade', { status: 426 })
  }
  const pair = new WebSocketPair()
  const client = pair[0]
  const server = pair[1]
  ;(server as any).accept()
  try { console.log('[echo] upgrade OK') } catch {}

  server.addEventListener('message', (ev: MessageEvent) => {
    try { (server as any).send(ev.data) } catch {}
  })
  server.addEventListener('close', () => { try { console.log('[echo] close') } catch {} })
  server.addEventListener('error', () => { try { console.log('[echo] error') } catch {} })

  return new Response(null, { status: 101, webSocket: client } as any)
}

