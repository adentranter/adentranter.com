"use client"

import { cn } from "@/lib/utils"

interface SkyLanternsProps {
  className?: string
}

export default function SkyLanterns({ className }: SkyLanternsProps) {
  return (
    <div className={cn("pointer-events-none select-none absolute inset-0 z-5", className)}>
      {/* Lantern 1 - Smallest, starts first */}
      <div className="absolute left-[15%] bottom-[15%] animate-float-1">
        <svg width="10" height="13" viewBox="0 0 10 13" className="drop-shadow-[0_0_3px_rgba(255,200,100,0.15)]">
          {/* Lantern body - more boxy */}
          <rect x="1" y="4" width="8" height="6" fill="#e6a800" stroke="#d49400" strokeWidth="0.3" rx="0.5" />
          {/* Lantern top */}
          <rect x="2" y="2" width="6" height="2" fill="#d49400" rx="0.5" />
          {/* Lantern bottom weight */}
          <rect x="2" y="10" width="6" height="1.5" fill="#b8860b" rx="0.3" />
          {/* String - positioned for realistic swinging */}
          <line x1="5" y1="2" x2="5" y2="0" stroke="#8b4513" strokeWidth="0.6" strokeDasharray="1,1" />
          {/* Glow effect - much dimmer */}
          <rect x="0" y="2" width="10" height="8" fill="none" stroke="rgba(255,200,100,0.08)" strokeWidth="1" rx="1" />
        </svg>
      </div>

      {/* Lantern 2 - Medium size, starts after 8 minutes */}
      <div className="absolute left-[75%] bottom-[12%] animate-float-2" style={{ animationDelay: '8s' }}>
        <svg width="13" height="18" viewBox="0 0 13 18" className="drop-shadow-[0_0_4px_rgba(255,180,80,0.12)]">
          {/* Lantern body - more boxy */}
          <rect x="1" y="5" width="11" height="10" fill="#d49400" stroke="#b8860b" strokeWidth="0.4" rx="0.8" />
          {/* Lantern top */}
          <rect x="3" y="3" width="7" height="2.5" fill="#b8860b" rx="0.8" />
          {/* Lantern bottom weight */}
          <rect x="2" y="15" width="10" height="2" fill="#a0522d" rx="0.5" />
          {/* String - positioned for realistic swinging */}
          <line x1="6" y1="3" x2="6" y2="0" stroke="#8b4513" strokeWidth="0.8" strokeDasharray="1.5,1.5" />
          {/* Glow effect - much dimmer */}
          <rect x="-1" y="3" width="15" height="14" fill="none" stroke="rgba(255,180,80,0.06)" strokeWidth="1.5" rx="1" />
        </svg>
      </div>

      {/* Lantern 3 - Largest, starts after 16 minutes */}
      <div className="absolute left-[45%] bottom-[18%] animate-float-3" style={{ animationDelay: '16s' }}>
        <svg width="16" height="22" viewBox="0 0 16 22" className="drop-shadow-[0_0_5px_rgba(255,220,120,0.18)]">
          {/* Lantern body - more boxy */}
          <rect x="2" y="6" width="12" height="11" fill="#e6b800" stroke="#d4af37" strokeWidth="0.5" rx="1" />
          {/* Lantern top */}
          <rect x="4" y="4" width="8" height="3" fill="#d4af37" rx="1" />
          {/* Lantern bottom weight */}
          <rect x="3" y="17" width="11" height="2" fill="#b8860b" rx="0.5" />
          {/* String - positioned for realistic swinging */}
          <line x1="8" y1="4" x2="8" y2="0" stroke="#8b4513" strokeWidth="1" strokeDasharray="2,1" />
          {/* Glow effect - much dimmer */}
          <rect x="0" y="4" width="16" height="16" fill="none" stroke="rgba(255,220,120,0.12)" strokeWidth="2" rx="2" />
        </svg>
      </div>
    </div>
  )
}
