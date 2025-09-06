export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const preferredRegion = 'syd1'

type Session = {
  sinks: Set<WritableStreamDefaultWriter<Uint8Array>>
}

const sessions: Map<string, Session> = new Map()

function getSession(id: string): Session {
  let s = sessions.get(id)
  if (!s) { s = { sinks: new Set() }; sessions.set(id, s) }
  return s
}

export async function POST(req: Request, ctx: { params: Promise<{ session: string }> }) {
  const { session } = await ctx.params
  const s = getSession(session)
  let body: any
  try { body = await req.json() } catch { return new Response('Bad JSON', { status: 400 }) }
  const url = new URL(req.url)
  const playerId = url.searchParams.get('playerId') || undefined
  const encoder = new TextEncoder()
  const payload = JSON.stringify({ type: 'input', playerId, input: body })
  const chunk = encoder.encode(`data: ${payload}\n\n`)
  for (const w of s.sinks) { try { await w.write(chunk) } catch {} }
  return new Response('ok')
}

