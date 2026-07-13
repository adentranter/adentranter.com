import { NextResponse } from "next/server"
import { z } from "zod"

import { getSql } from "@/lib/db"
import {
  extractClientIp,
  extractHomeIpKey,
  isValidIp,
  safeEqual,
} from "@/lib/home-ip"
import { ensureSchema } from "@/lib/schema"

export const runtime = "nodejs"

const bodySchema = z.object({
  ip: z.string().trim().optional(),
})

export async function POST(request: Request) {
  const configuredKey = process.env.HOME_IP_KEY
  if (!configuredKey) {
    return NextResponse.json(
      { error: "Home IP reporting is not configured." },
      { status: 503 }
    )
  }

  const providedKey = extractHomeIpKey(request)
  if (!providedKey || !safeEqual(providedKey, configuredKey)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const sql = getSql()
  if (!sql) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 })
  }

  let bodyIp: string | undefined
  try {
    const raw = await request.json().catch(() => ({}))
    bodyIp = bodySchema.parse(raw).ip
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  const ip = bodyIp ?? extractClientIp(request)
  if (!ip || !isValidIp(ip)) {
    return NextResponse.json({ error: "Could not determine a valid IP address." }, { status: 400 })
  }

  const userAgent = request.headers.get("user-agent")

  try {
    await ensureSchema(sql)

    await sql`
      INSERT INTO home_ip (id, ip, user_agent, updated_at)
      VALUES (1, ${ip}, ${userAgent}, NOW())
      ON CONFLICT (id)
      DO UPDATE SET
        ip = EXCLUDED.ip,
        user_agent = EXCLUDED.user_agent,
        updated_at = NOW()
    `

    return NextResponse.json({ ok: true, ip })
  } catch (error) {
    console.error("[home-ip] POST failed", error)
    return NextResponse.json({ error: "Could not save home IP." }, { status: 500 })
  }
}
