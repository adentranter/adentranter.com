export type SaveKind = 'sram' | 'state'

export const MAX_SAVE_BYTES = 2 * 1024 * 1024

export function isSaveKind(value: unknown): value is SaveKind {
  return value === 'sram' || value === 'state'
}

export function normalizeSaveCode(input: string): string | null {
  const code = input.trim().toLowerCase().replace(/\s+/g, '-')
  return /^[a-z0-9][a-z0-9_-]{3,63}$/.test(code) ? code : null
}

// Uploaded and remote copies of the same ROM file share saves
export function gameKeyFor(name: string): string {
  return name.replace(/\.(smc|sfc|zip|7z|fig|swc)$/i, '').trim().toLowerCase().slice(0, 200)
}

export function generateSaveCode(): string {
  const id = (crypto as any)?.randomUUID?.() || Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
  return String(id).replace(/-/g, '').slice(0, 10)
}

function saveUrl(code: string, game: string, kind: SaveKind) {
  const params = new URLSearchParams({ code, game, kind })
  return `/api/snes/saves?${params.toString()}`
}

export async function downloadSave(code: string, game: string, kind: SaveKind): Promise<Uint8Array | null> {
  const res = await fetch(saveUrl(code, game, kind), { cache: 'no-store' })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Cloud save download failed (${res.status})`)
  return new Uint8Array(await res.arrayBuffer())
}

export async function uploadSave(
  code: string,
  game: string,
  kind: SaveKind,
  data: Uint8Array,
  keepalive = false
): Promise<boolean> {
  try {
    const res = await fetch(saveUrl(code, game, kind), {
      method: 'PUT',
      headers: { 'content-type': 'application/octet-stream' },
      body: new Blob([data.slice()]),
      keepalive,
    })
    return res.ok
  } catch {
    return false
  }
}

// Cheap change detection so unchanged in-game saves aren't re-uploaded
export function saveFingerprint(data: Uint8Array): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < data.length; i++) {
    hash ^= data[i]
    hash = Math.imul(hash, 0x01000193)
  }
  return `${data.length}:${(hash >>> 0).toString(16)}`
}
