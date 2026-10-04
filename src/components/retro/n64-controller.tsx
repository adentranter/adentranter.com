"use client"

import { useRef, useState } from 'react'
import { canHapticNow, haptic } from '@/lib/haptics'
import { ControllerGates, ControllerStatus, useControllerLink } from '@/components/retro/use-controller-link'

type Props = { sessionId: string; playerId: string }

type Point = { x: number; y: number }
type Zone = 'stick' | 'face' | 'dpad' | 'fixed'
type FaceButton = 'a' | 'b' | 'cup' | 'cdown' | 'cleft' | 'cright'

const FACE_BUTTONS: FaceButton[] = ['a', 'b', 'cup', 'cdown', 'cleft', 'cright']

const C_LABEL: Record<string, string> = { cup: '▲', cdown: '▼', cleft: '◀', cright: '▶' }

// Fraction of the stick radius ignored around centre so a resting thumb doesn't drift
const STICK_DEAD_ZONE = 0.12

// tan(22.5°): splits the pad into eight equal 45° sectors so diagonals are possible
const DIAGONAL_RATIO = 0.4142

function layoutFor(w: number, h: number) {
  const u = Math.min(w, h)
  const shoulderH = Math.max(44, h * 0.15)
  const midY = shoulderH + (h - shoulderH) * 0.52
  const cCenter = { x: w * 0.86, y: midY - u * 0.08 }
  const cGap = u * 0.1
  return {
    w,
    h,
    u,
    shoulderH,
    stick: { x: w * 0.2, y: midY, radius: u * 0.2 },
    start: { x: w * 0.5, y: shoulderH + (h - shoulderH) * 0.3 },
    startBottom: shoulderH + (h - shoulderH) * 0.5,
    dpad: { x: w * 0.5, y: shoulderH + (h - shoulderH) * 0.75, size: u * 0.26 },
    cSize: u * 0.12,
    face: {
      a: { x: w * 0.72, y: midY + u * 0.16 },
      b: { x: w * 0.66, y: midY - u * 0.02 },
      cup: { x: cCenter.x, y: cCenter.y - cGap },
      cdown: { x: cCenter.x, y: cCenter.y + cGap },
      cleft: { x: cCenter.x - cGap, y: cCenter.y },
      cright: { x: cCenter.x + cGap, y: cCenter.y },
    } as Record<FaceButton, Point>,
    faceSize: { a: u * 0.19, b: u * 0.16 },
    shoulders: {
      l: { left: 0, width: w * 0.24 },
      z: { left: w * 0.6, width: w * 0.2 },
      r: { left: w * 0.8, width: w * 0.2 },
    },
  }
}

type Layout = ReturnType<typeof layoutFor>

function nearestFaceButton(p: Point, g: Layout): FaceButton {
  let best: FaceButton = 'a'
  let bestDist = Infinity
  for (const button of FACE_BUTTONS) {
    const c = g.face[button]
    const d = Math.hypot(p.x - c.x, p.y - c.y)
    if (d < bestDist) { best = button; bestDist = d }
  }
  return best
}

function dpadControls(p: Point, g: Layout): string[] {
  const dx = p.x - g.dpad.x
  const dy = p.y - g.dpad.y
  if (Math.hypot(dx, dy) < g.dpad.size * 0.08) return []
  const out: string[] = []
  if (dy < 0 && -dy > Math.abs(dx) * DIAGONAL_RATIO) out.push('up')
  if (dy > 0 && dy > Math.abs(dx) * DIAGONAL_RATIO) out.push('down')
  if (dx < 0 && -dx > Math.abs(dy) * DIAGONAL_RATIO) out.push('left')
  if (dx > 0 && dx > Math.abs(dy) * DIAGONAL_RATIO) out.push('right')
  return out
}

// A touch keeps the zone it started in, so a thumb can sweep the stick or roll across buttons freely
function zoneAt(p: Point, g: Layout): { zone: Zone; fixed?: string } | null {
  if (p.y < g.shoulderH) {
    if (p.x < g.shoulders.l.width) return { zone: 'fixed', fixed: 'l' }
    if (p.x >= g.shoulders.r.left) return { zone: 'fixed', fixed: 'r' }
    if (p.x >= g.shoulders.z.left) return { zone: 'fixed', fixed: 'z' }
    return null
  }
  if (p.x < g.w * 0.4) return { zone: 'stick' }
  if (p.x > g.w * 0.6) return { zone: 'face' }
  if (p.y < g.startBottom) return { zone: 'fixed', fixed: 'start' }
  return { zone: 'dpad' }
}

function controlsFor(zone: Zone, p: Point, g: Layout, fixed?: string): string[] {
  if (zone === 'dpad') return dpadControls(p, g)
  if (zone === 'face') return [nearestFaceButton(p, g)]
  if (zone === 'fixed') return fixed ? [fixed] : []
  return []
}

// The stick floats: it centres wherever the thumb lands, so every grab starts from neutral
function stickVector(origin: Point, p: Point, radius: number): Point {
  const dx = (p.x - origin.x) / radius
  const dy = (p.y - origin.y) / radius
  const mag = Math.hypot(dx, dy)
  if (mag < STICK_DEAD_ZONE) return { x: 0, y: 0 }
  const scaled = Math.min(1, (mag - STICK_DEAD_ZONE) / (1 - STICK_DEAD_ZONE))
  return { x: (dx / mag) * scaled, y: (dy / mag) * scaled }
}

type Tracked = { zone: Zone; fixed?: string; controls: string[]; buzzOnRelease: boolean; origin?: Point }

export default function N64Controller({ sessionId, playerId }: Props) {
  const pointersRef = useRef(new Map<number, Tracked>())
  const stickPointerRef = useRef<number | null>(null)
  const [stick, setStick] = useState<{ origin: Point; vec: Point } | null>(null)
  const link = useControllerLink('n64', sessionId, playerId, {
    onReleaseAll: () => {
      pointersRef.current.clear()
      stickPointerRef.current = null
      setStick(null)
    },
  })
  const { surfaceRef, size, pressed, hold, release, syncPressed, sendAnalog } = link

  const layout = size.w > 0 ? layoutFor(size.w, size.h) : null

  function pointFrom(e: React.PointerEvent): Point {
    const rect = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function updateStick(origin: Point, p: Point, g: Layout) {
    const vec = stickVector(origin, p, g.stick.radius)
    setStick({ origin, vec })
    sendAnalog(vec.x, vec.y)
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!layout) return
    e.preventDefault()
    const p = pointFrom(e)
    const hit = zoneAt(p, layout)
    if (!hit) return
    if (hit.zone === 'stick' && stickPointerRef.current !== null) return
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch {}

    if (hit.zone === 'stick') {
      const r = layout.stick.radius
      const origin = {
        x: Math.max(r, Math.min(layout.w * 0.4 - r * 0.5, p.x)),
        y: Math.max(layout.shoulderH + r, Math.min(layout.h - r, p.y)),
      }
      stickPointerRef.current = e.pointerId
      pointersRef.current.set(e.pointerId, { zone: 'stick', controls: [], buzzOnRelease: false, origin })
      if (canHapticNow()) haptic(10)
      updateStick(origin, p, layout)
      return
    }

    const controls = controlsFor(hit.zone, p, layout, hit.fixed)
    let anyNew = false
    for (const c of controls) anyNew = hold(c) || anyNew
    // iOS only allows the haptic workaround inside an activated gesture; a touch's activation lands on release
    const buzzNow = anyNew && canHapticNow()
    if (buzzNow) haptic()
    pointersRef.current.set(e.pointerId, { ...hit, controls, buzzOnRelease: anyNew && !buzzNow })
    syncPressed()
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const tracked = pointersRef.current.get(e.pointerId)
    if (!tracked || !layout || tracked.zone === 'fixed') return
    if (tracked.zone === 'stick') {
      if (tracked.origin) updateStick(tracked.origin, pointFrom(e), layout)
      return
    }
    const next = controlsFor(tracked.zone, pointFrom(e), layout, tracked.fixed)
    const added = next.filter(c => !tracked.controls.includes(c))
    const removed = tracked.controls.filter(c => !next.includes(c))
    if (!added.length && !removed.length) return
    for (const c of removed) release(c)
    let anyNew = false
    for (const c of added) anyNew = hold(c) || anyNew
    if (anyNew && canHapticNow()) haptic(10)
    tracked.controls = next
    syncPressed()
  }

  function onPointerEnd(e: React.PointerEvent<HTMLDivElement>) {
    const tracked = pointersRef.current.get(e.pointerId)
    if (!tracked) return
    pointersRef.current.delete(e.pointerId)
    if (tracked.zone === 'stick') {
      stickPointerRef.current = null
      setStick(null)
      sendAnalog(0, 0)
      return
    }
    for (const c of tracked.controls) release(c)
    if (tracked.buzzOnRelease && e.type === 'pointerup') haptic()
    syncPressed()
  }

  const isDown = (control: string) => pressed.has(control)

  const stickOrigin = stick?.origin ?? (layout ? { x: layout.stick.x, y: layout.stick.y } : null)
  const stickVec = stick?.vec ?? { x: 0, y: 0 }

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#bdbdc4] text-[#33333a] touch-none select-none [-webkit-touch-callout:none] [-webkit-user-select:none]">
      <div
        ref={surfaceRef}
        className="relative h-[100dvh] w-full"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onContextMenu={(e) => e.preventDefault()}
      >
        {layout && stickOrigin && (
          <div className="pointer-events-none absolute inset-0">
            {/* Shoulder + Z triggers */}
            {(['l', 'z', 'r'] as const).map((control) => {
              const s = layout.shoulders[control]
              const rounding = control === 'l' ? 'rounded-br-[2.5rem] border-r-4' : control === 'r' ? 'rounded-bl-[2.5rem] border-l-4' : 'rounded-b-[1.5rem] border-x-4'
              return (
                <div
                  key={control}
                  className={`absolute top-0 flex items-center justify-center border-b-4 border-[#9a9aa3] text-lg font-bold transition-colors ${rounding} ${isDown(control) ? 'bg-[#8f8f99]' : 'bg-[#a9a9b2]'}`}
                  style={{ left: s.left, width: s.width, height: layout.shoulderH }}
                >
                  {control.toUpperCase()}
                </div>
              )
            })}

            {/* Analog stick */}
            <div
              className="absolute rounded-full bg-[#a4a4ad] shadow-[inset_0_4px_12px_rgba(0,0,0,0.25)]"
              style={{
                left: stickOrigin.x - layout.stick.radius,
                top: stickOrigin.y - layout.stick.radius,
                width: layout.stick.radius * 2,
                height: layout.stick.radius * 2,
              }}
            />
            <div
              className={`absolute rounded-full shadow-[0_4px_0_rgba(0,0,0,0.35)] ${stick ? 'bg-[#3c3c44]' : 'bg-[#55555e]'}`}
              style={{
                left: stickOrigin.x + stickVec.x * layout.stick.radius - layout.stick.radius * 0.45,
                top: stickOrigin.y + stickVec.y * layout.stick.radius - layout.stick.radius * 0.45,
                width: layout.stick.radius * 0.9,
                height: layout.stick.radius * 0.9,
              }}
            />

            {/* Start */}
            <div
              className={`absolute flex items-center justify-center rounded-full text-[10px] font-bold uppercase tracking-widest text-white shadow-[0_3px_0_rgba(0,0,0,0.35)] transition-transform ${isDown('start') ? 'translate-y-[2px] scale-95 bg-[#9e1824] shadow-none' : 'bg-[#c8202f]'}`}
              style={{
                left: layout.start.x - layout.u * 0.08,
                top: layout.start.y - layout.u * 0.08,
                width: layout.u * 0.16,
                height: layout.u * 0.16,
              }}
            >
              Start
            </div>

            {/* Compact D-pad */}
            {(['up', 'down', 'left', 'right'] as const).map((dir) => {
              const arm = layout.dpad.size / 3
              const offset = { up: [0, -arm], down: [0, arm], left: [-arm, 0], right: [arm, 0] }[dir]
              return (
                <div
                  key={dir}
                  className={`absolute rounded-sm shadow-md transition-colors ${isDown(dir) ? 'bg-[#111]' : 'bg-[#2d2d31]'}`}
                  style={{
                    left: layout.dpad.x + offset[0] - arm / 2,
                    top: layout.dpad.y + offset[1] - arm / 2,
                    width: arm,
                    height: arm,
                  }}
                />
              )
            })}
            <div
              className="absolute bg-[#2d2d31]"
              style={{
                left: layout.dpad.x - layout.dpad.size / 6,
                top: layout.dpad.y - layout.dpad.size / 6,
                width: layout.dpad.size / 3,
                height: layout.dpad.size / 3,
              }}
            />

            {/* A / B */}
            {(['a', 'b'] as const).map((button) => {
              const c = layout.face[button]
              const s = layout.faceSize[button]
              return (
                <div
                  key={button}
                  className={`absolute flex items-center justify-center rounded-full text-xl font-black text-white shadow-[0_4px_0_rgba(0,0,0,0.35)] transition-transform ${button === 'a' ? 'bg-[#2453b8]' : 'bg-[#1f8a43]'} ${isDown(button) ? 'translate-y-[3px] scale-95 brightness-90 shadow-none' : ''}`}
                  style={{ left: c.x - s / 2, top: c.y - s / 2, width: s, height: s }}
                >
                  {button.toUpperCase()}
                </div>
              )
            })}

            {/* C buttons */}
            {(['cup', 'cdown', 'cleft', 'cright'] as const).map((button) => {
              const c = layout.face[button]
              return (
                <div
                  key={button}
                  className={`absolute flex items-center justify-center rounded-full bg-[#f2c418] text-sm font-black text-[#3a2c00] shadow-[0_3px_0_rgba(0,0,0,0.35)] transition-transform ${isDown(button) ? 'translate-y-[2px] scale-95 brightness-90 shadow-none' : ''}`}
                  style={{ left: c.x - layout.cSize / 2, top: c.y - layout.cSize / 2, width: layout.cSize, height: layout.cSize }}
                >
                  {C_LABEL[button]}
                </div>
              )
            })}
          </div>
        )}

        <ControllerStatus link={link} playerId={playerId} />
      </div>

      <ControllerGates link={link} />
    </div>
  )
}
