"use client"

import { cn } from "@/lib/utils"

type Variant = "day" | "night"

interface MountainSilhouetteProps {
  variant?: Variant
  className?: string
}

export default function MountainSilhouette({ className }: MountainSilhouetteProps) {
  return (
    <div
      className={cn("pointer-events-none select-none absolute inset-x-0 bottom-0 z-0", className)}
      style={{ height: "var(--mountain-h, 32vh)" }}
    >
      <svg viewBox="0 0 1600 400" preserveAspectRatio="none" className="w-full h-full">
        <g transform="translate(0 -40)">
          {/* BACK LAYER */}
          <path
            d="M0 298 L250 118 L500 238 L750 178 L1000 218 L1250 158 L1600 198 L1600 400 L0 400 Z"
            fill="#1e2f4d"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* TINY PEAK AT VERY BACK LEFT */}
          <path
            d="M-250 298 L0 168 L250 298 L250 400 L-250 400 Z"
            fill="#1e2f4d"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* NEW INTERMEDIATE LAYER */}
          <path
            d="M0 340 L200 245 L400 290 L600 225 L800 275 L1000 210 L1250 295 L1600 235 L1600 400 L0 400 Z"
            fill="#15284a"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            transform="translate(0 -40)"
          />
          {/* MID LAYER */}
          <path
            transform="translate(0 20)"
            d="M0 350 L200 260 L400 300 L600 230 L800 280 L1000 210 L1200 300 L1600 240 L1600 400 L0 400 Z"
            fill="#102a4a"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        {/* FRONT LAYER */}
        <path
          d="M0 380 Q200 340 400 360 T800 300 T1050 260 L1600 260 L1600 400 L0 400 Z"
          fill="#081427"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Foreground details on flat section */}
        <g>
          {/* Trees */}
          <polygon points="220,340 230,300 240,340" fill="#081427" />
          <polygon points="360,350 372,310 384,350" fill="#081427" />
          <polygon points="500,330 512,290 524,330" fill="#081427" />
          <polygon points="640,340 652,300 664,340" fill="#081427" />
          <polygon points="1080,260 1090,230 1100,260" fill="#081427" />
          <polygon points="1120,260 1132,225 1144,260" fill="#081427" />
          {/* House 1 */}
          <rect x="1180" y="250" width="26" height="18" fill="#081427" />
          <polygon points="1170,250 1193,235 1216,250" fill="#081427" />
          {/* chimney */}
          <rect x="1198" y="227" width="4" height="10" fill="#081427" />
          <rect x="1186" y="256" width="6" height="6" fill="#ffd278" />
          {/* smoke - wind affected */}
          <g opacity="0.7">
            <path id="smokePath1" d="M 1200 227 c 8 -15, -2 -30, -6 -45, 12 -20, -8 -35, -4 -55" fill="none" stroke="none" />
            <circle r="2" fill="#e6eef9">
              <animateMotion dur="12s" repeatCount="indefinite" rotate="auto">
                <mpath href="#smokePath1" />
              </animateMotion>
              <animate attributeName="r" from="2" to="5" dur="12s" repeatCount="indefinite" />
              <animate attributeName="opacity" from="0.7" to="0" dur="12s" repeatCount="indefinite" />
            </circle>
            <circle r="1.5" fill="#e6eef9" opacity="0.5">
              <animateMotion dur="15s" repeatCount="indefinite" rotate="auto" begin="2s">
                <mpath href="#smokePath1" />
              </animateMotion>
              <animate attributeName="r" from="1.5" to="4" dur="15s" repeatCount="indefinite" />
              <animate attributeName="opacity" from="0.5" to="0" dur="15s" repeatCount="indefinite" />
            </circle>
          </g>
          {/* House 2 */}
          <rect x="1240" y="250" width="24" height="16" fill="#081427" />
          <polygon points="1230,250 1252,238 1274,250" fill="#081427" />
          <rect x="1246" y="256" width="6" height="6" fill="#ffd278" />
        </g>
      </svg>
    </div>
  )
}