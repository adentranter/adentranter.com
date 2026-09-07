import type { Metadata } from "next"

export const metadata: Metadata = {
  title: { absolute: "clone" },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      nosnippet: true,
    },
  },
}

export default function CloneLayout({ children }: { children: React.ReactNode }) {
  return children
}
