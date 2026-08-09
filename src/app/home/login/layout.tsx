import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Home Login",
  robots: { index: false, follow: false },
}

export default function HomeLoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
