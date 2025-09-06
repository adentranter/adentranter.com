import { broadcast } from "@/app/api/snes/_sseBus"

export const runtime = 'nodejs'

export async function POST(req: Request, { params }: any) {
  const sessionId = params.sessionid
  const url = new URL(req.url)
  const playerId = url.searchParams.get('playerId') || undefined

  let body: any
  try {
    body = await req.json()
  } catch {
    return new Response('Bad JSON', { status: 400 })
  }

  const type = body?.type
  if (type === 'button') {
    const control = String(body.control || '')
    const state = String(body.state || '')
    if (!control || (state !== 'down' && state !== 'up')) {
      return new Response('Invalid input', { status: 400 })
    }
    const packet = { type: 'input', input: { type: 'button', control, state }, playerId }
    await broadcast(sessionId, packet)
    return new Response('ok')
  }

  // Allow a lightweight hello/registration message to prime the channel
  if (type === 'hello') {
    await broadcast(sessionId, { type: 'hello', playerId, ts: Date.now() })
    return new Response('ok')
  }

  return new Response('Unsupported', { status: 400 })
}
