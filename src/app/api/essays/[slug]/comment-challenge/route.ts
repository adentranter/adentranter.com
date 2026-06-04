import { NextResponse } from "next/server"

import { createChallenge } from "@/lib/comment-challenge"

export const runtime = "nodejs"

export async function GET() {
  try {
    const challenge = createChallenge()
    return NextResponse.json(challenge, {
      headers: {
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("[comment-challenge] failed", error)
    return NextResponse.json({ error: "Comments are not configured yet." }, { status: 503 })
  }
}
