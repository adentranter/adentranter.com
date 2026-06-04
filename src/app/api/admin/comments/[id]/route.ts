import { NextResponse } from "next/server"

import { getSql } from "@/lib/db"
import { ensureSchema } from "@/lib/schema"

export const runtime = "nodejs"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const numericId = Number.parseInt(id, 10)
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return NextResponse.json({ error: "Invalid comment id." }, { status: 400 })
  }

  const sql = getSql()
  if (!sql) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 })
  }

  try {
    await ensureSchema(sql)
    const rows = await sql`
      DELETE FROM essay_comments
      WHERE id = ${numericId}
      RETURNING id
    `
    if (rows.length === 0) {
      return NextResponse.json({ error: "Comment not found." }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[admin/comments] DELETE failed", error)
    return NextResponse.json({ error: "Could not delete comment." }, { status: 500 })
  }
}
