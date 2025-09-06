'use client'

import { useEffect, useRef } from 'react'
import MoonriseGradient from '@/components/layout/moonrise-gradient'
import MountainSilhouette from '@/components/layout/mountain-silhouette'

export default function FireworksPage() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const fwRef = useRef<any>(null)

  useEffect(() => {
    let cancelled = false
    let cycleTimer: any
    let hueTimer: any
    ;(async () => {
      try {
        const mod = await import('fireworks-js')
        if (cancelled) return
        const { Fireworks } = mod as any
        if (containerRef.current && Fireworks) {
          const rect = containerRef.current.getBoundingClientRect()
          const bounds = {
            // Narrow DX range so rockets go mostly straight up (±~5%)
            x: Math.floor(rect.width * 0.45),
            // Push DY start lower so bursts stay near the bottom of the overlay
            y: Math.floor(rect.height * 0.15),
            width: Math.floor(rect.width),
            height: Math.floor(rect.height),
            debug: false,
          }

          // ensure fully transparent behind the particles
          containerRef.current.style.background = 'transparent'

          fwRef.current = new Fireworks(containerRef.current, {
            autoresize: true,
            // primary brights, narrow bands (reds / blues / greens via cycling below)
            hue: { min: 0, max: 40 },
            brightness: { min: 65, max: 90 },
            opacity: 0.12,
            // slower launches and blooms
            acceleration: 1.0,
            friction: 0.985,
            gravity: 0.9,
            decay: { min: 0.008, max: 0.012 },
            // cadence slower
            delay: { min: 120, max: 220 },
            intensity: 1.0,
            // smaller pieces, slower trails
            particles: 120,
            traceLength: 3,
            traceSpeed: 6,
            // base radius must be >= 1 (library floors to int)
            explosion: 1.2,
            // single mortar near the houses (right side)
            // launch from near the right side (toward the houses)
            rocketsPoint: { min: 88, max: 90 },
            boundaries: bounds,
            lineStyle: 'square' as any,
            lineWidth: {
              explosion: { min: 1.0, max: 3.0 },
              trace: { min: 0.1, max: 0.8 },
            } as any,
            mouse: { click: false, move: false, max: 0 },
          })

          fwRef.current.start()

          // make canvas background explicitly transparent (defensive)
          setTimeout(() => {
            const cvs = containerRef.current?.querySelector('canvas') as HTMLCanvasElement | null
            if (cvs) cvs.style.background = 'transparent'
          }, 0)

          // cycle explosion radius between base and -50% for variety
          const base = 2.0
          let small = true
          cycleTimer = setInterval(() => {
            if (!fwRef.current) return
            // Clamp to >= 1 to avoid zero-length explosion trails
            const nextExplosion = small ? Math.max(1, base * 0.5) : base
            if (typeof fwRef.current.updateOptions === 'function') {
              fwRef.current.updateOptions({ explosion: nextExplosion })
            } else if ((fwRef.current as any).setOptions) {
              ;(fwRef.current as any).setOptions({ explosion: nextExplosion })
            }
            small = !small
          }, 6000)

          // gently rotate hue bands across primary brights
          const bands = [
            { min: 0, max: 40 },   // reds
            { min: 190, max: 240 }, // blues
            { min: 100, max: 140 }, // greens
          ]
          let hi = 0
          hueTimer = setInterval(() => {
            if (!fwRef.current) return
            const band = bands[hi % bands.length]
            if (typeof fwRef.current.updateOptions === 'function') {
              fwRef.current.updateOptions({ hue: band })
            } else if ((fwRef.current as any).setOptions) {
              ;(fwRef.current as any).setOptions({ hue: band })
            }
            hi += 1
          }, 8000)
        }
      } catch (e) {
        console.warn('fireworks-js not available', e)
      }
    })()
    return () => {
      cancelled = true
      if (cycleTimer) clearInterval(cycleTimer)
      if (hueTimer) clearInterval(hueTimer)
      if (fwRef.current) {
        try { fwRef.current.stop() } catch {}
        try { fwRef.current.clear() } catch {}
        fwRef.current = null
      }
    }
  }, [])

  return (
    <div className="relative w-full overflow-hidden" style={{ "--mountain-h": "32vh" } as React.CSSProperties}>
      {/* Sky background with lanterns */}
      <MoonriseGradient className="min-h-screen" />

      {/* Fireworks layer: bottom-right region only, masked to avoid a hard edge */}
      <div
        className="absolute right-0 bottom-0 z-[4] pointer-events-none"
        style={{
          width: '22vw',
          minWidth: '280px',
          height: '44vh',
          WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,1) 28%)',
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,1) 28%)',
        }}
      >
        <div ref={containerRef} className="absolute inset-0" style={{ background: 'transparent' }} />
      </div>

      {/* Mountains in front */}
      <MountainSilhouette className="z-[10]" />
    </div>
  )
}
