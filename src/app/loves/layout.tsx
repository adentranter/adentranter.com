import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Loves",
  robots: { index: false, follow: false },
}

export default function LovesLayout({ children }: { children: React.ReactNode }) {
  return children
}
