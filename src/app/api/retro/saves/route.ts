import { NextResponse } from "next/server"

import { getSql } from "@/lib/db"
import { ensureSchema } from "@/lib/schema"
import { isSaveKind, MAX_SAVE_BYTES, normalizeSaveCode, type SaveKind } from "@/lib/retro/saves"

export const runtime = "nodejs"

function parseParams(request: Request): { code: string; game: string; kind: SaveKind } | null {
  const url = new URL(request.url)
  const code = normalizeSaveCode(url.searchParams.get("code") ?? "")
  const game = (url.searchParams.get("game") ?? "").trim()
  const kind = url.searchParams.get("kind")
  if (!code || !game || game.length > 200 || !isSaveKind(kind)) return null
  return { code, game, kind }
}

export async function GET(request: Request) {
  const sql = getSql()
  if (!sql) {
    return NextResponse.json({ error: "Cloud saves are not configured." }, { status: 503 })
  }

  const params = parseParams(request)
  if (!params) {
    return NextResponse.json({ error: "Invalid save code, game, or kind." }, { status: 400 })
  }

  try {
    await ensureSchema(sql)
    const rows = await sql<{ data: Buffer; updated_at: Date }>`
      SELECT data, updated_at
      FROM snes_saves
      WHERE save_code = ${params.code} AND game = ${params.game} AND kind = ${params.kind}
      LIMIT 1
    `
    const row = rows[0]
    if (!row) {
      return NextResponse.json({ error: "No save found." }, { status: 404 })
    }
    return new Response(new Uint8Array(row.data), {
      headers: {
        "content-type": "application/octet-stream",
        "cache-control": "no-store",
        "x-save-updated-at": new Date(row.updated_at).toISOString(),
      },
    })
  } catch (error) {
    console.error("Retro save download failed", error)
    return NextResponse.json({ error: "Could not load save right now." }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const sql = getSql()
  if (!sql) {
    return NextResponse.json({ error: "Cloud saves are not configured." }, { status: 503 })
  }

  const params = parseParams(request)
  if (!params) {
    return NextResponse.json({ error: "Invalid save code, game, or kind." }, { status: 400 })
  }

  const data = Buffer.from(await request.arrayBuffer())
  if (data.length === 0 || data.length > MAX_SAVE_BYTES) {
    return NextResponse.json({ error: "Save is empty or too large." }, { status: 413 })
  }

  try {
    await ensureSchema(sql)
    await sql`
      INSERT INTO snes_saves (save_code, game, kind, data, size)
      VALUES (${params.code}, ${params.game}, ${params.kind}, ${data}, ${data.length})
      ON CONFLICT (save_code, game, kind)
      DO UPDATE SET data = EXCLUDED.data, size = EXCLUDED.size, updated_at = NOW()
    `
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Retro save upload failed", error)
    return NextResponse.json({ error: "Could not store save right now." }, { status: 500 })
  }
}
