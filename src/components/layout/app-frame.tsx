"use client"

import { usePathname } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"

export default function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const hideChrome =
    pathname?.startsWith("/fireworks") ||
    (pathname?.startsWith("/snes/") && pathname?.includes("/player/"))

  if (hideChrome) {
    return (
      <div className="min-h-screen flex flex-col relative z-10">
        <main className="flex-grow">{children}</main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col relative z-10">
      <Navbar />
      <main className="container flex-grow">{children}</main>
      <footer className="text-center space-y-2 text-sm text-white/50 font-light py-8 ">
        <p className="md:flex items-center justify-center gap-1.5 hidden">
          Strategically placed footer text because UX research says you&apos;ll trust me more
        </p>
        <p className="flex items-center justify-center gap-1.5 text-xs">
          <span className="md:hidden">Probably the most over-engineered footer you&apos;ll see today</span>
          <span className="hidden md:inline">Crafted with <span className="text-red-400">❤️</span> from Townsville 
          <span className="text-xs">(because apparently that makes it more authentic)</span></span>
        </p>
        <p className="text-xs italic hidden md:block">
          * Studies show footers with hearts increase conversion by 0% but we do it anyway
        </p>
      </footer>
    </div>
  )
}

