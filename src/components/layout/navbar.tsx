"use client"

import Link from "next/link"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { ChevronDown, Github, Linkedin, Instagram, Twitter } from "lucide-react"

const distractionLinks = [
  { label: "my photos", href: "/distractions/photos" },
  { label: "woodworking", href: "/distractions/woodworking" },
] as const

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
          <Link href="/essays" className="text-white/70 transition-colors hover:text-primary">
            essays
          </Link>

          <DropdownMenu.Root>
            <DropdownMenu.Trigger
              title="or overlapping venn diagrams"
              className="inline-flex items-center gap-1 text-white/70 transition-colors hover:text-primary outline-none data-[state=open]:text-primary"
            >
              distractions
              <ChevronDown className="h-4 w-4" />
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="z-50 min-w-[180px] rounded-lg border border-white/10 bg-slate-900/95 p-1 shadow-lg backdrop-blur"
                sideOffset={8}
                align="center"
              >
                {distractionLinks.map((link) => (
                  <DropdownMenu.Item key={link.href} asChild>
                    <Link
                      href={link.href}
                      className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-white/70 outline-none transition-colors hover:text-primary focus:bg-white/5 focus:text-primary cursor-pointer"
                    >
                      {link.label}
                      {'soon' in link && link.soon && (
                        <span className="text-xs text-white/40 ml-2">soon</span>
                      )}
                    </Link>
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          {false && (
            <Link href="/snes" className="text-white/70 transition-colors hover:text-primary">
              snes
            </Link>
          )}

        </nav>

        {/* Hide social icons on mobile */}
        <div className="hidden md:flex items-center space-x-4 text-white/70">
          <nav className="flex items-center space-x-4">
            <Link href="https://instagram.com/adentranter" target="_blank" rel="noreferrer">
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
