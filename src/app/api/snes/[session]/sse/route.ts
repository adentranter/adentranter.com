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

export async function GET(req: Request, ctx: { params: Promise<{ session: string }> }) {
  const { session } = await ctx.params
  const { sinks } = getSession(session)
  const encoder = new TextEncoder()

  const stream = new TransformStream<Uint8Array, Uint8Array>()
  const writer = stream.writable.getWriter()
  sinks.add(writer)
  try { await writer.write(encoder.encode(`event: open\n` + `data: {"ok":true}\n\n`)) } catch {}

  const keepAlive = setInterval(async () => {
    try { await writer.write(encoder.encode(`: ping\n\n`)) } catch {}
  }, 15000)

  const close = async () => {
    clearInterval(keepAlive)
    sinks.delete(writer)
    try { await writer.close() } catch {}
    if (sinks.size === 0) sessions.delete(session)
  }

  // Vercel will call this when client disconnects
  ;(req as any).signal?.addEventListener('abort', close)

  return new Response(stream.readable, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-store',
      'connection': 'keep-alive',
      'access-control-allow-origin': '*',
    },
  })
}

