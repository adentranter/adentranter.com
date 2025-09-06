import SnesClient from "@/components/snes/client"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "SNES Session",
  robots: { index: false, follow: false },
}

export default async function SnesSessionPage({ params }: any) {
  const { sessionid } = await params
  return <SnesClient sessionId={sessionid} />
}


