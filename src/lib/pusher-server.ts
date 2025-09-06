import Pusher from 'pusher'

let _pusher: Pusher | null | undefined

export function getPusher(): Pusher | null {
  if (_pusher !== undefined) return _pusher
  const appId = process.env.PUSHER_APP_ID
  const key = process.env.PUSHER_KEY
  const secret = process.env.PUSHER_SECRET
  const cluster = process.env.PUSHER_CLUSTER
  if (!appId || !key || !secret || !cluster) {
    _pusher = null
    return _pusher
  }
  _pusher = new Pusher({ appId, key, secret, cluster, useTLS: true })
  return _pusher
}

export async function publishToPusher(channel: string, event: string, data: any) {
  const p = getPusher()
  if (!p) return
  try { await p.trigger(channel, event, data) } catch {}
}

