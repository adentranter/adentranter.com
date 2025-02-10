"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="relative rounded-md p-2 hover:bg-accent/10 transition-colors"
    >
      <Sun className="h-5 w-5 transition-all dark:scale-0" />
      <Moon className="absolute top-1/2 left-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 scale-0 transition-all dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </button>
  )
} 