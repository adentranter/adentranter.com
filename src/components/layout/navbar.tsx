"use client"

import Link from "next/link"
import { Github, Linkedin, Instagram, Twitter } from "lucide-react"

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-primary bg-slate-900/70 backdrop-blur">
      <div className="container flex h-20 items-center">
        <Link href="/" className="flex items-center space-x-2">
          <span className="font-bold text-2xl text-white">aden tranter</span>
        </Link>
        
        <nav className="flex flex-1 items-center justify-center space-x-8 text-base font-medium">
          <Link href="/about" className="text-white/70 transition-colors hover:text-primary">
            about
          </Link>
 
          <Link href="mailto:adentranter@gmail.com" className="hidden md:inline-block text-white/70 transition-colors hover:text-primary">
            book a coffee
          </Link>
        </nav>

        {/* Hide social icons on mobile */}
        <div className="hidden md:flex items-center space-x-4 text-white/70">
          <nav className="flex items-center space-x-4">
            <Link href="https://instagram.com/sdgrasshopper" target="_blank" rel="noreferrer">
              <Instagram className="h-5 w-5" />
            </Link>
            <Link href="https://twitter.com/adentranter" target="_blank" rel="noreferrer">
              <Twitter className="h-5 w-5" />
            </Link>
          </nav>
          <span className="h-4 w-px bg-white/20" />
          <nav className="flex items-center space-x-4">
            <Link href="https://github.com/adentranter" target="_blank" rel="noreferrer">
              <Github className="h-5 w-5" />
            </Link>
            <Link href="https://linkedin.com/in/adentranter" target="_blank" rel="noreferrer">
              <Linkedin className="h-5 w-5" />
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
} 