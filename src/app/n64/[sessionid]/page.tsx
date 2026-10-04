import RetroClient from "@/components/retro/client"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "N64 Session",
  robots: { index: false, follow: false },
}

export default async function N64SessionPage({ params }: any) {
  const { sessionid } = await params
  return <RetroClient system="n64" sessionId={sessionid} />
}
