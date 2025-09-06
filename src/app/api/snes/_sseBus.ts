// Simple in-memory SSE bus keyed by sessionId.
// Note: This only persists within a single server process.

type Writer = WritableStreamDefaultWriter<Uint8Array>

type Channel = {
  writers: Set<Writer>
}

type Bus = Map<string, Channel>

declare global {
  // eslint-disable-next-line no-var
  var __snesSseBus: Bus | undefined
}

function getBus(): Bus {
  if (!globalThis.__snesSseBus) {
    globalThis.__snesSseBus = new Map()
  }
  return globalThis.__snesSseBus
}

export function getChannel(sessionId: string): Channel {
  const bus = getBus()
  let ch = bus.get(sessionId)
  if (!ch) {
    ch = { writers: new Set() }
    bus.set(sessionId, ch)
  }
  return ch
}

export function addClient(sessionId: string, w: Writer) {
  const ch = getChannel(sessionId)
  ch.writers.add(w)
  return () => {
    try { w.close() } catch {}
    ch.writers.delete(w)
  }
}

export async function broadcast(sessionId: string, data: any) {
  const ch = getChannel(sessionId)
  const payload = `data: ${JSON.stringify(data)}\n\n`
  const bytes = new TextEncoder().encode(payload)
  const toDelete: Writer[] = []
  await Promise.all(Array.from(ch.writers).map(async (w) => {
    try { await w.write(bytes) } catch { toDelete.push(w) }
  }))
  toDelete.forEach((w) => ch.writers.delete(w))
}

