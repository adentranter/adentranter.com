"use client"

import { cn } from "@/lib/utils"
import SkyLanterns from "./layoutAnimations/sky-lanterns"

interface MoonriseGradientProps {
  children?: React.ReactNode
  className?: string
}

export default function MoonriseGradient({
  children,
  className,
}: MoonriseGradientProps) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden",
        className
      )}
      style={{
        minHeight: "100%",
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 bottom-0 right-0 z-0"
        style={{
          left: "calc(-1 * var(--scene-left-cut, 0px))",
          // 4 stacked backgrounds, back (last) → front (first)
          backgroundImage: [
            // (1) Outermost moon glow ring - large white diffusion (off to the left)
            'radial-gradient(800px 600px at 25% -20%,' +
              'rgba(255,255,255,0.04) 0%,' +
              'rgba(255,250,245,0.03) 35%,' +
              'rgba(255,245,240,0.02) 60%,' +
              'rgba(255,240,235,0) 85%)',

            // (2) Middle moon glow ring - soft silver white
            'radial-gradient(500px 400px at 25% -15%,' +
              'rgba(255,255,255,0.06) 0%,' +
              'rgba(255,250,245,0.05) 30%,' +
              'rgba(255,245,240,0.04) 50%,' +
              'rgba(255,240,235,0.03) 70%,' +
              'rgba(255,235,230,0) 85%)',

            // (3) Inner moon glow - bright silver
            'radial-gradient(300px 240px at 25% -10%,' +
              'rgba(255,255,255,0.12) 0%,' +
              'rgba(255,250,245,0.10) 25%,' +
              'rgba(255,245,240,0.08) 45%,' +
              'rgba(255,240,235,0.05) 65%,' +
              'rgba(255,235,230,0) 85%)',

            // (4) Base gradient - deep night blues, matching mountain silhouette colors
            'linear-gradient(to bottom,' +
              '#2a3a5a 0%,' +        // lighter at the top (near moon)
              '#1e2f4d 20%,' +       // mountain back layer color
              '#15284a 40%,' +       // mountain back layer color
              '#0f1f35 60%,' +       // medium dark blue
              '#0a1a2f 80%,' +       // slightly lighter
              '#081427 100%)'
          ].join(','),
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'scroll',
          backgroundBlendMode: 'normal, screen, normal',
        }}
      />
      {/* content above the background */}
      <div className="relative z-10" style={{ paddingBottom: "var(--mountain-h, 32vh)" }}>{children}</div>
      
      {/* Sky Lanterns floating in the night sky */}
      <SkyLanterns />
      
      {/* silhouette moved to ThemedGradient */}
    </div>
  )
}
