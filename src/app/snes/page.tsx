import SnesClient from "@/components/snes/client"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "SNES",
  robots: { index: false, follow: false },
}

export default function SnesPage() {
  return <SnesClient />
}
