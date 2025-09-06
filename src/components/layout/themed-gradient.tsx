"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import SunsetGradient from "./sunset-gradient"
import MoonriseGradient from "./moonrise-gradient"
import MountainSilhouette from "./mountain-silhouette"

interface ThemedGradientProps {
  children?: React.ReactNode
  className?: string
}

export default function ThemedGradient({ children, className }: ThemedGradientProps) {
  const { theme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration mismatch by not rendering theme-dependent content until mounted
  if (!mounted) {
    return (
      <div className="relative w-full overflow-hidden" style={{ "--mountain-h": "32vh" } as React.CSSProperties}>
        <SunsetGradient className={className}>{children}</SunsetGradient>
        <MountainSilhouette variant="day" />
      </div>
    )
  }

  const effectiveTheme = theme === "system" || !theme ? systemTheme : theme
  const isDark = effectiveTheme === "dark"

  const Wrapper = isDark ? MoonriseGradient : SunsetGradient

  return (
    <div className="relative w-full overflow-hidden" style={{ "--mountain-h": "32vh" } as React.CSSProperties}>
      <Wrapper className={className}>{children}</Wrapper>
      <MountainSilhouette variant={isDark ? "night" : "day"} />
    </div>
  )
}

