import { NextResponse } from "next/server"
import { z } from "zod"

import {
  getUploadAnswer,
  isUploadConfigured,
  safeEqual,
  signUploadSession,
  UPLOAD_SESSION_COOKIE,
} from "@/lib/upload-auth"

export const runtime = "nodejs"

const accessSchema = z.object({
  answer: z.string().min(1),
})

export async function POST(request: Request) {
  if (!isUploadConfigured()) {
    return NextResponse.json({ error: "Upload is not configured." }, { status: 503 })
  }

  let answer: string
  try {
    const raw = await request.json()
    answer = accessSchema.parse(raw).answer
  } catch {
    return NextResponse.json({ error: "Answer is required." }, { status: 400 })
  }

  if (!safeEqual(answer, getUploadAnswer())) {
    return NextResponse.json({ error: "Wrong answer." }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set({
    name: UPLOAD_SESSION_COOKIE,
    value: signUploadSession(),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  })

  return response
}
