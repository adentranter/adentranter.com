import { createHmac } from "node:crypto"
import { NextResponse } from "next/server"
import { z } from "zod"

import { verifyChallenge } from "@/lib/comment-challenge"
import { getSql } from "@/lib/db"
import { ensureSchema } from "@/lib/schema"

export const runtime = "nodejs"

const postSchema = z.object({
  authorName: z.string().trim().min(1).max(80),
  body: z.string().trim().min(1).max(2000),
  challengeToken: z.string().min(1),
  challengeAnswer: z.string().min(1).max(120),
  website: z.string().max(200).optional(),
})

const RATE_LIMIT_PER_HOUR = 5

function hashIp(ip: string): string | null {
  const secret = process.env.COMMENT_CHALLENGE_SECRET
  if (!secret || !ip) {
    return null
  }
  return createHmac("sha256", secret).update(ip).digest("hex")
}

function challengeErrorMessage(reason: string | undefined): string {
  if (reason === "expired") return "Check expired. Grab a fresh problem."
  if (reason === "wrong") return "That isn't quite right. Try the math problem again."
  return "Check could not be verified. Refresh and try again."
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim()
    if (first) return first
  }
  return request.headers.get("x-real-ip") || ""
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const sql = getSql()
  if (!sql) {
    return NextResponse.json({ comments: [] })
  }

  try {
    await ensureSchema(sql)
    const rows = await sql`
      SELECT id, author_name, body, created_at
      FROM essay_comments
      WHERE essay_slug = ${slug}
      ORDER BY created_at ASC
    `
    const comments = rows.map((row) => ({
      id: String(row.id),
      authorName: row.author_name,
      body: row.body,
      createdAt:
        row.created_at instanceof Date
          ? row.created_at.toISOString()
          : new Date(row.created_at as string).toISOString(),
    }))
    return NextResponse.json(
      { comments },
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch (error) {
    console.error("[comments] GET failed", error)
    return NextResponse.json({ error: "Could not load comments right now." }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const sql = getSql()
  if (!sql) {
    return NextResponse.json({ error: "Comments are not configured yet." }, { status: 503 })
  }

  let payload: z.infer<typeof postSchema>
  try {
    const raw = await request.json()
    payload = postSchema.parse(raw)
  } catch {
    return NextResponse.json({ error: "Please fill in your name and comment." }, { status: 400 })
  }

  if (payload.website && payload.website.length > 0) {
    return NextResponse.json({ ok: true, comment: null })
  }

  const verification = verifyChallenge(payload.challengeToken, payload.challengeAnswer)
  if (!verification.ok) {
    return NextResponse.json({ error: challengeErrorMessage(verification.reason) }, { status: 400 })
  }

  try {
    await ensureSchema(sql)

    const essayRows = await sql`SELECT 1 FROM essays WHERE slug = ${slug} LIMIT 1`
    if (essayRows.length === 0) {
      return NextResponse.json({ error: "Essay not found." }, { status: 404 })
    }

    const ipHash = hashIp(getClientIp(request))
    if (ipHash) {
      const rateRows = await sql`
        SELECT COUNT(*)::int AS count
        FROM essay_comments
        WHERE ip_hash = ${ipHash}
          AND created_at > NOW() - INTERVAL '1 hour'
      `
      const count = Number(rateRows[0]?.count ?? 0)
      if (count >= RATE_LIMIT_PER_HOUR) {
        return NextResponse.json(
          { error: "You've left a lot of comments in the last hour. Try again later." },
          { status: 429 }
        )
      }
    }

    const inserted = await sql`
      INSERT INTO essay_comments (essay_slug, author_name, body, ip_hash)
      VALUES (${slug}, ${payload.authorName}, ${payload.body}, ${ipHash})
      RETURNING id, author_name, body, created_at
    `
    const row = inserted[0]
    const comment = {
      id: String(row.id),
      authorName: row.author_name,
      body: row.body,
      createdAt:
        row.created_at instanceof Date
          ? row.created_at.toISOString()
          : new Date(row.created_at as string).toISOString(),
    }

    return NextResponse.json({ ok: true, comment })
  } catch (error) {
    console.error("[comments] POST failed", error)
    return NextResponse.json({ error: "Could not save your comment right now." }, { status: 500 })
  }
}
