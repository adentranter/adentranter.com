import { NextResponse } from "next/server"
import { z } from "zod"

import {
  getDashboardPassword,
  HOME_SESSION_COOKIE,
  isDashboardConfigured,
  safeEqual,
  signSession,
} from "@/lib/home-auth"

export const runtime = "nodejs"

const loginSchema = z.object({
  password: z.string().min(1),
})

export async function POST(request: Request) {
  if (!isDashboardConfigured()) {
    return NextResponse.json({ error: "Home dashboard is not configured." }, { status: 503 })
  }

  let password: string
  try {
    const raw = await request.json()
    password = loginSchema.parse(raw).password
  } catch {
    return NextResponse.json({ error: "Password is required." }, { status: 400 })
  }

  const configuredPassword = getDashboardPassword()
  if (!configuredPassword || !safeEqual(password, configuredPassword)) {
    return NextResponse.json({ error: "Invalid password." }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set({
    name: HOME_SESSION_COOKIE,
    value: signSession(),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  })

  return response
}
