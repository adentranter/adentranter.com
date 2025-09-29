"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import SunsetGradient from "./sunset-gradient"
import MoonriseGradient from "./moonrise-gradient"
import MountainSilhouette from "./mountain-silhouette"
import { cn } from "@/lib/utils"

interface ThemedGradientProps {
  children?: React.ReactNode
  className?: string
  gradientClassName?: string
}

export default function ThemedGradient({
  children,
  className,
  gradientClassName,
}: ThemedGradientProps) {
  const { theme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration mismatch by not rendering theme-dependent content until mounted
  if (!mounted) {
    return (
      <div
        className={cn("relative w-full overflow-hidden", className)}
        style={{ "--mountain-h": "32vh" } as React.CSSProperties}
      >
        <SunsetGradient className={gradientClassName}>{children}</SunsetGradient>
        <MountainSilhouette variant="day" />
      </div>
    )
  }

  const effectiveTheme = theme === "system" || !theme ? systemTheme : theme
  const isDark = effectiveTheme === "dark"

  const Wrapper = isDark ? MoonriseGradient : SunsetGradient

  return (
    <div
      className={cn("relative w-full overflow-hidden", className)}
      style={{ "--mountain-h": "32vh" } as React.CSSProperties}
    >
      <Wrapper className={gradientClassName}>{children}</Wrapper>
      <MountainSilhouette variant={isDark ? "night" : "day"} />
    </div>
  )
}
