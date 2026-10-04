import { publishToPusher } from '@/lib/pusher-server'
import { pusherChannelFor, type RetroSystemId } from '@/lib/retro/systems'

function clampAxis(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  return Math.round(Math.max(-1, Math.min(1, value)) * 100) / 100
}

export async function handleControllerPush(req: Request, system: RetroSystemId, sessionId: string) {
  const url = new URL(req.url)
  const playerId = url.searchParams.get('playerId') || undefined
  const channel = pusherChannelFor(system, sessionId)

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
    await publishToPusher(channel, 'input', packet)
    return new Response('ok')
  }

  if (type === 'analog') {
    const x = clampAxis(body.x)
    const y = clampAxis(body.y)
    if (body.stick !== 'left' || x === null || y === null) {
      return new Response('Invalid input', { status: 400 })
    }
    const packet = { type: 'input', input: { type: 'analog', stick: 'left', x, y }, playerId }
    await publishToPusher(channel, 'input', packet)
    return new Response('ok')
  }

  // Allow a lightweight hello/registration message to prime the channel
  if (type === 'hello') {
    const hello = { type: 'hello', playerId, ts: Date.now() }
    await publishToPusher(channel, 'hello', hello)
    return new Response('ok')
  }

  return new Response('Unsupported', { status: 400 })
}
