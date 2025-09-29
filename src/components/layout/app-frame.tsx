"use client"

import { usePathname } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import ThemedGradient from "@/components/layout/themed-gradient"

export default function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const hideChrome =
    pathname?.startsWith("/fireworks") ||
    (pathname?.startsWith("/snes/") && pathname?.includes("/player/"))

  if (hideChrome) {
    return (
      <div className="relative flex min-h-screen flex-col">
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
          <ThemedGradient className="h-full" gradientClassName="h-full" />
        </div>
        <main className="relative z-10 flex-grow" style={{ paddingBottom: "32vh" }}>
          {children}
        </main>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <ThemedGradient className="h-full" gradientClassName="h-full" />
      </div>
      <Navbar />
      <main
        className="container relative z-10 flex-grow pt-16"
        style={{ paddingBottom: "calc(32vh + 4rem)" }}
      >
        {children}
      </main>
    </div>
  )
}
