import SnesClient from "@/components/snes/client"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "SNES Session",
  robots: { index: false, follow: false },
}

export default function SnesSessionPage({ params }: any) {
  const { sessionid } = params
  return <SnesClient sessionId={sessionid} />
}


