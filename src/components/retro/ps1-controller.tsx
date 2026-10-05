"use client"

import { useRef } from 'react'
import { canHapticNow, haptic } from '@/lib/haptics'
import { ControllerGates, ControllerStatus, useControllerLink } from '@/components/retro/use-controller-link'

type Props = { sessionId: string; playerId: string }

type Point = { x: number; y: number }
type Zone = 'dpad' | 'face' | 'fixed'
type FaceButton = 'triangle' | 'circle' | 'cross' | 'square'
type Shoulder = 'l2' | 'l1' | 'r1' | 'r2'

const FACE_BUTTONS: FaceButton[] = ['triangle', 'circle', 'cross', 'square']

const FACE_SYMBOL: Record<FaceButton, string> = {
  triangle: '△',
  circle: '○',
  cross: '✕',
  square: '□',
}

const FACE_COLOR: Record<FaceButton, string> = {
  triangle: 'text-[#3fbf8f]',
  circle: 'text-[#ff6b6b]',
  cross: 'text-[#7ea6ff]',
  square: 'text-[#f08fd0]',
}

// Left to right across the top edge, each a quarter-ish of the width
const SHOULDERS: { id: Shoulder; label: string; left: number }[] = [
  { id: 'l2', label: 'L2', left: 0 },
  { id: 'l1', label: 'L1', left: 0.21 },
  { id: 'r1', label: 'R1', left: 0.58 },
  { id: 'r2', label: 'R2', left: 0.79 },
]

// tan(22.5°): splits the pad into eight equal 45° sectors so diagonals are possible
const DIAGONAL_RATIO = 0.4142

function layoutFor(w: number, h: number) {
  const u = Math.min(w, h)
  const shoulderH = Math.max(48, h * 0.16)
  const midY = shoulderH + (h - shoulderH) * 0.52
  const faceGap = u * 0.15
  const faceCenter = { x: w * 0.78, y: midY }
  return {
    w,
    h,
    shoulderH,
    centerTop: shoulderH + (h - shoulderH) * 0.45,
    dpad: { x: w * 0.2, y: midY, size: u * 0.44 },
    faceCenter,
    faceSize: u * 0.17,
    face: {
      triangle: { x: faceCenter.x, y: faceCenter.y - faceGap },
      circle: { x: faceCenter.x + faceGap, y: faceCenter.y },
      cross: { x: faceCenter.x, y: faceCenter.y + faceGap },
      square: { x: faceCenter.x - faceGap, y: faceCenter.y },
    } as Record<FaceButton, Point>,
  }
}

type Layout = ReturnType<typeof layoutFor>

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

function nearestFaceButton(p: Point, g: Layout): FaceButton {
  let best: FaceButton = 'cross'
  let bestDist = Infinity
  for (const button of FACE_BUTTONS) {
    const c = g.face[button]
    const d = Math.hypot(p.x - c.x, p.y - c.y)
    if (d < bestDist) { best = button; bestDist = d }
  }
  return best
}

function shoulderAt(x: number, w: number): Shoulder {
  if (x < w * 0.21) return 'l2'
  if (x < w * 0.5) return 'l1'
  if (x < w * 0.79) return 'r1'
  return 'r2'
}

// Every touch lands in a zone, so near misses still count. A touch keeps the zone it started in,
// which lets a thumb roll around the d-pad or across the face buttons without hitting Start.
function zoneAt(p: Point, g: Layout): { zone: Zone; fixed?: string } | null {
  if (p.y < g.shoulderH) return { zone: 'fixed', fixed: shoulderAt(p.x, g.w) }
  if (p.x < g.w * 0.4) return { zone: 'dpad' }
  if (p.x > g.w * 0.6) return { zone: 'face' }
  if (p.y > g.centerTop) return { zone: 'fixed', fixed: p.x < g.w / 2 ? 'select' : 'start' }
  return null
}

function controlsFor(zone: Zone, p: Point, g: Layout, fixed?: string): string[] {
  if (zone === 'dpad') return dpadControls(p, g)
  if (zone === 'face') return [nearestFaceButton(p, g)]
  return fixed ? [fixed] : []
}

export default function Ps1Controller({ sessionId, playerId }: Props) {
  const pointersRef = useRef(new Map<number, { zone: Zone; fixed?: string; controls: string[]; buzzOnRelease: boolean }>())
  const link = useControllerLink('ps1', sessionId, playerId, { onReleaseAll: () => pointersRef.current.clear() })
  const { surfaceRef, size, pressed, hold, release, syncPressed } = link

  const layout = size.w > 0 ? layoutFor(size.w, size.h) : null

  function pointFrom(e: React.PointerEvent): Point {
    const rect = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!layout) return
    e.preventDefault()
    const hit = zoneAt(pointFrom(e), layout)
    if (!hit) return
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch {}
    const controls = controlsFor(hit.zone, pointFrom(e), layout, hit.fixed)
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
    for (const c of tracked.controls) release(c)
    if (tracked.buzzOnRelease && e.type === 'pointerup') haptic()
    syncPressed()
  }

  const isDown = (control: string) => pressed.has(control)

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#c4c4c8] text-[#3b3b40] touch-none select-none [-webkit-touch-callout:none] [-webkit-user-select:none]">
      <div
        ref={surfaceRef}
        className="relative h-[100dvh] w-full"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onContextMenu={(e) => e.preventDefault()}
      >
        {layout && (
          <div className="pointer-events-none absolute inset-0">
            {/* Shoulder buttons */}
            {SHOULDERS.map((s) => (
              <div
                key={s.id}
                className={`absolute top-0 flex items-center justify-center border-b-4 border-[#9e9ea6] text-lg font-bold transition-colors ${
                  s.id === 'l2' ? 'rounded-br-[2rem] border-r-4' : s.id === 'r2' ? 'rounded-bl-[2rem] border-l-4' : 'border-x-2'
                } ${isDown(s.id) ? 'bg-[#8f8f99]' : 'bg-[#acacb4]'}`}
                style={{ left: `${s.left * 100}%`, width: '21%', height: layout.shoulderH }}
              >
                {s.label}
              </div>
            ))}

            {/* D-pad */}
            <div
              className="absolute rounded-full bg-[#b3b3ba] shadow-[inset_0_4px_10px_rgba(0,0,0,0.18)]"
              style={{
                left: layout.dpad.x - layout.dpad.size * 0.62,
                top: layout.dpad.y - layout.dpad.size * 0.62,
                width: layout.dpad.size * 1.24,
                height: layout.dpad.size * 1.24,
              }}
            />
            {(['up', 'down', 'left', 'right'] as const).map((dir) => {
              const arm = layout.dpad.size / 3
              const offset = { up: [0, -arm], down: [0, arm], left: [-arm, 0], right: [arm, 0] }[dir]
              return (
                <div
                  key={dir}
                  className={`absolute rounded-md shadow-md transition-colors ${isDown(dir) ? 'bg-[#1c1c20]' : 'bg-[#3a3a40]'}`}
                  style={{
                    left: layout.dpad.x + offset[0] - arm / 2,
                    top: layout.dpad.y + offset[1] - arm / 2,
                    width: arm,
                    height: arm,
                  }}
                />
              )
            })}

            {/* Face button well */}
            <div
              className="absolute rounded-full bg-[#b3b3ba] shadow-[inset_0_4px_12px_rgba(0,0,0,0.2)]"
              style={{
                left: layout.faceCenter.x - layout.faceSize * 1.55,
                top: layout.faceCenter.y - layout.faceSize * 1.55,
                width: layout.faceSize * 3.1,
                height: layout.faceSize * 3.1,
              }}
            />
            {FACE_BUTTONS.map((button) => {
              const c = layout.face[button]
              return (
                <div
                  key={button}
                  className={`absolute flex items-center justify-center rounded-full bg-[#2f2f35] text-2xl font-black shadow-[0_4px_0_rgba(0,0,0,0.35)] transition-transform ${FACE_COLOR[button]} ${isDown(button) ? 'translate-y-[3px] scale-95 brightness-90 shadow-none' : ''}`}
                  style={{
                    left: c.x - layout.faceSize / 2,
                    top: c.y - layout.faceSize / 2,
                    width: layout.faceSize,
                    height: layout.faceSize,
                  }}
                >
                  {FACE_SYMBOL[button]}
                </div>
              )
            })}

            {/* Select / Start */}
            {(['select', 'start'] as const).map((control) => {
              const x = control === 'select' ? layout.w * 0.44 : layout.w * 0.56
              const y = layout.centerTop + (layout.h - layout.centerTop) * 0.45
              return (
                <div key={control} className="absolute flex flex-col items-center gap-2" style={{ left: x - 40, top: y - 12, width: 80 }}>
                  <div className={`h-5 w-14 rounded-full shadow-inner transition-colors ${isDown(control) ? 'bg-[#2a2a2e]' : 'bg-[#55555c]'}`} />
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#5a5a63]">{control}</div>
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
