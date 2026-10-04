"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { canHapticNow, haptic } from '@/lib/haptics'

type Props = { sessionId: string; playerId: string }

type Point = { x: number; y: number }
type Zone = 'dpad' | 'face' | 'fixed'
type FaceButton = 'a' | 'b' | 'x' | 'y'

const FACE_BUTTONS: FaceButton[] = ['x', 'a', 'b', 'y']

const FACE_STYLE: Record<FaceButton, string> = {
  a: 'bg-[#c8202f] text-white',
  b: 'bg-[#f2c418] text-[#3a2c00]',
  x: 'bg-[#2457b8] text-white',
  y: 'bg-[#1f8a43] text-white',
}

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
      x: { x: faceCenter.x, y: faceCenter.y - faceGap },
      a: { x: faceCenter.x + faceGap, y: faceCenter.y },
      b: { x: faceCenter.x, y: faceCenter.y + faceGap },
      y: { x: faceCenter.x - faceGap, y: faceCenter.y },
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
  let best: FaceButton = 'a'
  let bestDist = Infinity
  for (const button of FACE_BUTTONS) {
    const c = g.face[button]
    const d = Math.hypot(p.x - c.x, p.y - c.y)
    if (d < bestDist) { best = button; bestDist = d }
  }
  return best
}

// Every touch lands in a zone, so near misses still count. A touch keeps the zone it started in,
// which lets a thumb roll around the d-pad or across the face buttons without hitting Start.
function zoneAt(p: Point, g: Layout): { zone: Zone; fixed?: string } | null {
  if (p.y < g.shoulderH) return { zone: 'fixed', fixed: p.x < g.w / 2 ? 'l' : 'r' }
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

export default function SnesController({ sessionId, playerId }: Props) {
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPortrait, setIsPortrait] = useState(false)
  const [fsSupported, setFsSupported] = useState(false)
  const [started, setStarted] = useState(false)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [pressed, setPressed] = useState<Set<string>>(() => new Set())

  const surfaceRef = useRef<HTMLDivElement | null>(null)
  const pointersRef = useRef(new Map<number, { zone: Zone; fixed?: string; controls: string[]; buzzOnRelease: boolean }>())
  const holdCountsRef = useRef(new Map<string, number>())
  const sendChainsRef = useRef(new Map<string, Promise<unknown>>())

  const pushUrl = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return `/api/snes/${encodeURIComponent(sessionId)}/push?playerId=${encodeURIComponent(playerId)}`
  }, [sessionId, playerId])

  // Register this controller session with the host via a lightweight hello
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!pushUrl) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(pushUrl, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ type: 'hello', ts: Date.now() }),
        })
        if (!cancelled) {
          if (res.ok) { setConnected(true) }
          else {
            // Fallback: send a no-op button event to ensure session creation
            const res2 = await fetch(pushUrl, {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ type: 'button', control: '__hello', state: 'down' }),
            })
            if (res2.ok) setConnected(true)
            else setError('Failed to register with host')
          }
        }
      } catch {
        if (!cancelled) setError('Failed to reach host')
      }
    })()
    return () => { cancelled = true }
  }, [pushUrl])

  // Lock page scrolling while controller is open
  useEffect(() => {
    if (typeof document === 'undefined') return
    const prevHtml = document.documentElement.style.overflow
    const prevBody = document.body.style.overflow
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = prevHtml
      document.body.style.overflow = prevBody
    }
  }, [])

  // Track orientation and fullscreen capability
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(orientation: portrait)')
    const update = () => setIsPortrait(mq.matches)
    update()
    mq.addEventListener?.('change', update)
    setFsSupported(!!document.documentElement.requestFullscreen)
    return () => { mq.removeEventListener?.('change', update) }
  }, [])

  useEffect(() => {
    const el = surfaceRef.current
    if (!el) return
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const playerPrefix = useMemo(() => {
    if (playerId === '1') return 'p1'
    if (playerId === '2') return 'p2'
    return null
  }, [playerId])

  const mapControl = (control: string) => {
    if (control.startsWith('__')) return control
    return playerPrefix ? `${playerPrefix}_${control}` : control
  }

  // Requests for the same button are chained so a quick tap's release can never overtake its press
  function send(control: string, state: 'down' | 'up') {
    if (!pushUrl) return
    const body = JSON.stringify({ type: 'button', control: mapControl(control), state })
    const prev = sendChainsRef.current.get(control) ?? Promise.resolve()
    const next = prev
      .catch(() => {})
      .then(() => fetch(pushUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: true }))
      .catch((err) => console.error('[Controller] Network error:', err))
    sendChainsRef.current.set(control, next)
  }

  // Two thumbs can hold the same button, so only the first press and last release are sent
  function hold(control: string): boolean {
    const counts = holdCountsRef.current
    const n = (counts.get(control) ?? 0) + 1
    counts.set(control, n)
    if (n === 1) send(control, 'down')
    return n === 1
  }

  function release(control: string) {
    const counts = holdCountsRef.current
    const n = (counts.get(control) ?? 0) - 1
    if (n > 0) { counts.set(control, n); return }
    counts.delete(control)
    send(control, 'up')
  }

  function syncPressed() {
    setPressed(new Set(holdCountsRef.current.keys()))
  }

  function releaseAll() {
    for (const control of Array.from(holdCountsRef.current.keys())) {
      holdCountsRef.current.set(control, 1)
      release(control)
    }
    pointersRef.current.clear()
    syncPressed()
  }

  useEffect(() => {
    const onHide = () => { if (document.hidden) releaseAll() }
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('blur', releaseAll)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('blur', releaseAll)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pushUrl])

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

  async function enableFullscreenAndLock() {
    try {
      if (document.fullscreenElement == null) {
        await document.documentElement.requestFullscreen()
      }
    } catch {}
    try {
      const anyScreen = (screen as any)
      if (anyScreen?.orientation?.lock) {
        await anyScreen.orientation.lock('landscape')
      }
    } catch {
      // orientation lock might be disallowed until PWA install; ignore
    }
  }

  async function handleStart() {
    haptic(40)
    await enableFullscreenAndLock()
    setStarted(true)
  }

  const triggerMenuToggle = () => {
    haptic(30)
    send('__menu', 'down')
    window.setTimeout(() => send('__menu', 'up'), 120)
  }

  const isDown = (control: string) => pressed.has(control)

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#c9c9d1] text-[#3d3a5c] touch-none select-none [-webkit-touch-callout:none] [-webkit-user-select:none]">
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
            <div
              className={`absolute left-0 top-0 flex items-center justify-center rounded-br-[2.5rem] border-b-4 border-r-4 border-[#a5a5b0] text-lg font-bold transition-colors ${isDown('l') ? 'bg-[#9d9daa]' : 'bg-[#b6b6c1]'}`}
              style={{ width: '42%', height: layout.shoulderH }}
            >
              L
            </div>
            <div
              className={`absolute right-0 top-0 flex items-center justify-center rounded-bl-[2.5rem] border-b-4 border-l-4 border-[#a5a5b0] text-lg font-bold transition-colors ${isDown('r') ? 'bg-[#9d9daa]' : 'bg-[#b6b6c1]'}`}
              style={{ width: '42%', height: layout.shoulderH }}
            >
              R
            </div>

            {/* D-pad */}
            <div
              className="absolute rounded-full bg-[#b9b9c3] shadow-[inset_0_4px_10px_rgba(0,0,0,0.18)]"
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
                  className={`absolute rounded-md shadow-md transition-colors ${isDown(dir) ? 'bg-[#111]' : 'bg-[#2d2d31]'}`}
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

            {/* Face button well */}
            <div
              className="absolute rotate-[-25deg] rounded-[45%] bg-[#a8a6bd] shadow-[inset_0_4px_12px_rgba(0,0,0,0.2)]"
              style={{
                left: layout.faceCenter.x - layout.faceSize * 1.8,
                top: layout.faceCenter.y - layout.faceSize * 1.25,
                width: layout.faceSize * 3.6,
                height: layout.faceSize * 2.5,
              }}
            />
            {FACE_BUTTONS.map((button) => {
              const c = layout.face[button]
              return (
                <div
                  key={button}
                  className={`absolute flex items-center justify-center rounded-full text-xl font-black shadow-[0_4px_0_rgba(0,0,0,0.35)] transition-transform ${FACE_STYLE[button]} ${isDown(button) ? 'translate-y-[3px] scale-95 brightness-90 shadow-none' : ''}`}
                  style={{
                    left: c.x - layout.faceSize / 2,
                    top: c.y - layout.faceSize / 2,
                    width: layout.faceSize,
                    height: layout.faceSize,
                  }}
                >
                  {button.toUpperCase()}
                </div>
              )
            })}

            {/* Select / Start */}
            {(['select', 'start'] as const).map((control) => {
              const x = control === 'select' ? layout.w * 0.44 : layout.w * 0.56
              const y = layout.centerTop + (layout.h - layout.centerTop) * 0.45
              return (
                <div key={control} className="absolute flex flex-col items-center gap-2" style={{ left: x - 40, top: y - 12, width: 80 }}>
                  <div className={`h-5 w-16 rotate-[-25deg] rounded-full shadow-inner transition-colors ${isDown(control) ? 'bg-[#2a2a2e]' : 'bg-[#55555c]'}`} />
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#5b5794]">{control}</div>
                </div>
              )
            })}
          </div>
        )}

        {/* Status + host menu */}
        <div className="absolute left-1/2 top-2 z-10 flex -translate-x-1/2 flex-col items-center gap-1 text-xs">
          <div className="font-semibold">
            P{playerId} · {connected ? <span className="text-emerald-700">ready</span> : <span className="opacity-60">connecting…</span>}
          </div>
          {error && <div className="text-red-700">{error}</div>}
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={triggerMenuToggle}
            className="rounded-full border border-[#8f8da6] bg-[#e4e4ea] px-3 py-1 font-semibold text-[#3d3a5c]"
            title="Toggle the host menu for saves and library"
          >
            Menu
          </button>
        </div>
      </div>

      {/* Tap-to-start gate (requests fullscreen + lock) */}
      {!started && (
        <button onClick={handleStart} className="fixed inset-0 bg-black/90 backdrop-blur flex items-center justify-center p-6 text-center text-white">
          <div className="space-y-3">
            <div className="text-lg font-medium">Tap to start</div>
            <div className="text-sm text-white/70">Enables fullscreen and tries to lock landscape.</div>
          </div>
        </button>
      )}

      {/* Portrait overlay asking to rotate / enable fullscreen (shown after start) */}
      {started && isPortrait && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur flex items-center justify-center p-6 text-center text-white">
          <div className="space-y-3">
            <div className="text-lg font-medium">Rotate your phone</div>
            <div className="text-sm text-white/70">This controller is best in landscape.</div>
            {fsSupported && (
              <button onClick={enableFullscreenAndLock} className="mt-1 px-3 py-1.5 rounded bg-white/10 hover:bg-white/20">
                Enable fullscreen & try lock
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
