import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import { randomUUID } from "crypto"

export const metadata: Metadata = {
  title: "Games",
  robots: { index: false, follow: false },
}

export default async function GamesPage() {
  // Without this the redirect is prerendered and every visitor shares one session id
  await connection()
  redirect(`/games/snes/${encodeURIComponent(randomUUID())}`)
}
