"use client"

import { cn } from "@/lib/utils"

interface SunsetGradientProps {
  children?: React.ReactNode
  className?: string
}

export default function SunsetGradient({
  children,
  className,
}: SunsetGradientProps) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden",
        className
      )}
      style={{
        minHeight: "100%",
        // 3 stacked backgrounds, back (last) → front (first)
        backgroundImage: [
          // (1) Outermost sun glow ring - large white diffusion
          'radial-gradient(900px 720px at 78% calc(100% - var(--mountain-h, 32vh) + 20vh),' +
            'rgba(255,255,255,0.15) 0%,' +
            'rgba(255,250,245,0.12) 35%,' +
            'rgba(255,245,240,0.08) 60%,' +
            'rgba(255,240,235,0) 85%)',

          // (2) Middle sun glow ring - warm golden white
          'radial-gradient(660px 520px at 78% calc(100% - var(--mountain-h, 32vh) + 20vh),' +
            'rgba(255,245,220,0.45) 0%,' +
            'rgba(255,235,200,0.35) 30%,' +
            'rgba(255,225,180,0.25) 50%,' +
            'rgba(255,215,160,0.15) 70%,' +
            'rgba(255,205,140,0) 85%)',

          // (3) Inner sun glow - rich golden orange
          'radial-gradient(440px 340px at 78% calc(100% - var(--mountain-h, 32vh) + 20vh),' +
            'rgba(255,235,180,0.95) 0%,' +
            'rgba(255,215,150,0.85) 25%,' +
            'rgba(255,195,120,0.65) 45%,' +
            'rgba(255,175,90,0.45) 65%,' +
            'rgba(255,155,60,0) 85%)',

          // (4) Core sun - intense golden center
          'radial-gradient(280px 220px at 78% calc(100% - var(--mountain-h, 32vh) + 20vh),' +
            'rgba(255,250,235,1) 0%,' +
            'rgba(255,240,180,0.95) 15%,' +
            'rgba(255,225,125,0.90) 30%,' +
            'rgba(255,210,70,0.80) 45%,' +
            'rgba(255,195,15,0.70) 60%,' +
            'rgba(255,180,0,0) 80%)',

          // (5) Innermost sun core - bright yellow-white
          'radial-gradient(160px 120px at 78% calc(100% - var(--mountain-h, 32vh) + 20vh),' +
            'rgba(255,255,255,1) 0%,' +
            'rgba(255,250,220,0.95) 20%,' +
            'rgba(255,245,180,0.90) 40%,' +
            'rgba(255,240,140,0.80) 60%,' +
            'rgba(255,235,100,0) 80%)',

          // (6) Bottom golden rays
          'linear-gradient(175deg, transparent 0%, rgba(255,215,170,0.1) 85%, rgba(255,225,180,0.15) 90%, rgba(255,235,190,0.2) 95%, rgba(255,245,200,0.15) 100%)',
          'linear-gradient(185deg, transparent 0%, rgba(255,215,170,0.1) 85%, rgba(255,225,180,0.15) 90%, rgba(255,235,190,0.2) 95%, rgba(255,245,200,0.15) 100%)',

          // (7) Base gradient - lighter daytime blues, with extended bottom
          'linear-gradient(to bottom,' +
            '#1e2c45 0%,' +        // lighter dark blue at top
            '#243550 15%,' +       // medium dark blue
            '#2a3b5c 30%,' +       // medium blue
            '#3a4b6c 45%,' +       // lighter medium blue
            '#4a5b7c 60%,' +       // light blue
            '#5a6b8c 75%,' +       // lighter blue
            '#6a7b9c 85%,' +       // lightest blue
            'transparent calc(100% - var(--mountain-h, 32vh) + 20vh),' +
            'transparent calc(100% + 50px))'  // Extended 50px further
        ].join(','),
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'scroll',
        backgroundBlendMode: 'normal, screen, normal',
      }}
    >
      {/* content above the background */}
      <div className="relative z-10" style={{ paddingBottom: "var(--mountain-h, 32vh)" }}>{children}</div>
      {/* silhouette moved to ThemedGradient */}
    </div>
  )
}
