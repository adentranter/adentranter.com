import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Too Wicked",
  robots: { index: false, follow: false },
}

export default function TooWickedLayout({ children }: { children: React.ReactNode }) {
  return children
}
