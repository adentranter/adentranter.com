import { NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'

import { getRetroSystem, isRetroSystemId, isRomFileName, type RetroSystem } from '@/lib/retro/systems'

export const runtime = 'nodejs'

type Item = { name: string; url: string }

async function listDir(system: RetroSystem, dirAbs: string, urlBase: string): Promise<Item[]> {
  try {
    const entries = await fs.readdir(dirAbs, { withFileTypes: true })
    const out: Item[] = []
    for (const e of entries) {
      if (e.isDirectory()) continue
      const name = e.name
      if (!isRomFileName(system, name)) continue
      // Static files with commas in their names only resolve when the URL is percent-encoded
      out.push({ name, url: path.posix.join(urlBase, encodeURIComponent(name)) })
    }
    return out
  } catch {
    return []
  }
}

export async function GET(request: Request) {
  const param = new URL(request.url).searchParams.get('system') ?? 'snes'
  if (!isRetroSystemId(param)) {
    return NextResponse.json({ error: 'Unknown system.' }, { status: 400 })
  }
  const system = getRetroSystem(param)
  const pub = path.join(process.cwd(), 'public')
  const lists = await Promise.all(system.romDirs.map((d) => listDir(system, path.join(pub, d.dir), d.url)))
  const items = lists.flat().sort((x, y) => x.name.localeCompare(y.name))
  return NextResponse.json(items)
}
