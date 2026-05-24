import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { z } from "zod"

const mailingListSchema = z.object({
  email: z.string().trim().email(),
  name: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(500).optional(),
  source: z.string().trim().max(120).optional(),
})

export async function POST(request: Request) {
  const databaseUrl = process.env.NEON_DATABASE_URL

  if (!databaseUrl) {
    return NextResponse.json(
      { error: "Mailing list is not configured yet." },
      { status: 503 }
    )
  }

  let payload: z.infer<typeof mailingListSchema>
  try {
    const raw = await request.json()
    payload = mailingListSchema.parse(raw)
  } catch {
    return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 })
  }

  const sql = neon(databaseUrl)
  const source = payload.source || "homepage"
  const userAgent = request.headers.get("user-agent")
  const referrer = request.headers.get("referer")

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS mailing_list_signups (
        id BIGSERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        name TEXT,
        notes TEXT,
        source TEXT NOT NULL DEFAULT 'homepage',
        user_agent TEXT,
        referrer TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `

    await sql`
      INSERT INTO mailing_list_signups (email, name, notes, source, user_agent, referrer)
      VALUES (${payload.email.toLowerCase()}, ${payload.name ?? null}, ${payload.notes ?? null}, ${source}, ${userAgent}, ${referrer})
      ON CONFLICT (email)
      DO UPDATE SET
        name = EXCLUDED.name,
        notes = EXCLUDED.notes,
        source = EXCLUDED.source,
        user_agent = EXCLUDED.user_agent,
        referrer = EXCLUDED.referrer,
        updated_at = NOW()
    `

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Mailing list signup failed", error)
    return NextResponse.json({ error: "Could not save signup right now." }, { status: 500 })
  }
}
