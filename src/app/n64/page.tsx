import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import { randomUUID } from "crypto"

export const metadata: Metadata = {
  title: "N64",
  robots: { index: false, follow: false },
}

export default async function N64Page() {
  // Without this the redirect is prerendered and every visitor shares one session id
  await connection()
  const sid = randomUUID()
  redirect(`/n64/${encodeURIComponent(sid)}`)
}
