import { addClient } from "@/app/api/snes/_sseBus"

export const runtime = 'nodejs'

export async function GET(req: Request, { params }: any) {
  const sessionId = params.sessionid
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()
  const encoder = new TextEncoder()

  // Initial handshake and retry suggestion
  await writer.write(encoder.encode(`retry: 3000\n\n`))

  // Add to channel
  const cleanup = addClient(sessionId, writer)

  // Heartbeat to keep connection alive
  const hb = setInterval(() => {
    writer.write(encoder.encode(`: keep-alive ${Date.now()}\n\n`)).catch(() => {})
  }, 15000)

  // Close on client disconnect via AbortSignal (supported in Next.js Request)
  const abort = () => { clearInterval(hb); cleanup() }
  try { req.signal.addEventListener('abort', abort) } catch {}

  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    // CORS friendly defaults (same-origin still required for cookies; not needed here)
    'Access-Control-Allow-Origin': '*',
  })

  return new Response(stream.readable, { headers })
}
