import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { randomUUID } from "crypto"

export const metadata: Metadata = {
  title: "SNES",
  robots: { index: false, follow: false },
}

export default function SnesPage() {
  const sid = randomUUID()
  redirect(`/snes/${encodeURIComponent(sid)}`)
}
