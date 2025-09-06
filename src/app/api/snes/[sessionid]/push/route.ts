import { publishToPusher } from '@/lib/pusher-server'

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
    // Pusher fanout
    await publishToPusher(`snes-${sessionId}`, 'input', packet)
    return new Response('ok')
  }

  // Allow a lightweight hello/registration message to prime the channel
  if (type === 'hello') {
    const hello = { type: 'hello', playerId, ts: Date.now() }
    await publishToPusher(`snes-${sessionId}`, 'hello', hello)
    return new Response('ok')
  }

  return new Response('Unsupported', { status: 400 })
}
