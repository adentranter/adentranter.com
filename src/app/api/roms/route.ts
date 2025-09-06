import { NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'

export const runtime = 'nodejs'

type Item = { name: string; url: string }

async function listDir(dirAbs: string, urlBase: string): Promise<Item[]> {
  try {
    const entries = await fs.readdir(dirAbs, { withFileTypes: true })
    const out: Item[] = []
    for (const e of entries) {
      if (e.isDirectory()) continue
      const name = e.name
      const lower = name.toLowerCase()
      if (!(lower.endsWith('.smc') || lower.endsWith('.sfc') || lower.endsWith('.zip') || lower.endsWith('.7z') || lower.endsWith('.fig') || lower.endsWith('.swc'))) continue
      out.push({ name, url: path.posix.join(urlBase, name) })
    }
    return out
  } catch {
    return []
  }
}

export async function GET() {
  const root = process.cwd()
  const pub = path.join(root, 'public')
  const romsDir = path.join(pub, 'roms')
  const snesDir = path.join(pub, 'snes')
  const atRomsDir = path.join(pub, '@roms')

  const a = await listDir(romsDir, '/roms')
  const b = await listDir(snesDir, '/snes')
  const c = await listDir(atRomsDir, '/@roms')
  const items = [...a, ...b, ...c].sort((x, y) => x.name.localeCompare(y.name))
  return NextResponse.json(items)
}
