"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { haptic } from '@/lib/haptics'
import { pushUrlFor, type RetroSystemId } from '@/lib/retro/systems'

// Stick updates are coalesced: one request in flight, at most this often, always ending on the latest value
const ANALOG_MIN_INTERVAL_MS = 50
// 0.05 steps keep a resting thumb from sending a stream of tiny changes
const ANALOG_STEPS = 20

type Options = { onReleaseAll?: () => void }

export function useControllerLink(system: RetroSystemId, sessionId: string, playerId: string, options: Options = {}) {
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPortrait, setIsPortrait] = useState(false)
  const [fsSupported, setFsSupported] = useState(false)
  const [started, setStarted] = useState(false)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [pressed, setPressed] = useState<Set<string>>(() => new Set())

  const surfaceRef = useRef<HTMLDivElement | null>(null)
  const holdCountsRef = useRef(new Map<string, number>())
  const sendChainsRef = useRef(new Map<string, Promise<unknown>>())
  const analogRef = useRef({ latest: { x: 0, y: 0 }, sent: { x: 0, y: 0 }, inFlight: false, timer: 0 })
  const optionsRef = useRef(options)

  const pushUrl = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return pushUrlFor(system, sessionId, playerId)
  }, [system, sessionId, playerId])
  const pushUrlRef = useRef(pushUrl)
  useEffect(() => {
    optionsRef.current = options
    pushUrlRef.current = pushUrl
  })

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

  const playerPrefix = playerId === '1' ? 'p1' : playerId === '2' ? 'p2' : null

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

  function flushAnalog() {
    const a = analogRef.current
    const url = pushUrlRef.current
    if (!url || a.inFlight || a.timer) return
    if (a.latest.x === a.sent.x && a.latest.y === a.sent.y) return
    const value = a.latest
    a.sent = value
    a.inFlight = true
    const startedAt = performance.now()
    fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'analog', stick: 'left', x: value.x, y: value.y }),
      keepalive: true,
    })
      .catch((err) => console.error('[Controller] Network error:', err))
      .finally(() => {
        a.inFlight = false
        const wait = ANALOG_MIN_INTERVAL_MS - (performance.now() - startedAt)
        if (wait > 0) {
          a.timer = window.setTimeout(() => { a.timer = 0; flushAnalog() }, wait)
        } else {
          flushAnalog()
        }
      })
  }

  function sendAnalog(x: number, y: number) {
    const q = (v: number) => (Math.round(Math.max(-1, Math.min(1, v)) * ANALOG_STEPS) / ANALOG_STEPS) || 0
    analogRef.current.latest = { x: q(x), y: q(y) }
    flushAnalog()
  }

  function releaseAll() {
    for (const control of Array.from(holdCountsRef.current.keys())) {
      holdCountsRef.current.set(control, 1)
      release(control)
    }
    const { latest } = analogRef.current
    if (latest.x !== 0 || latest.y !== 0) sendAnalog(0, 0)
    optionsRef.current.onReleaseAll?.()
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

  return {
    surfaceRef,
    size,
    connected,
    error,
    isPortrait,
    fsSupported,
    started,
    pressed,
    hold,
    release,
    syncPressed,
    sendAnalog,
    handleStart,
    enableFullscreenAndLock,
    triggerMenuToggle,
  }
}

type ControllerLink = ReturnType<typeof useControllerLink>

export function ControllerStatus({ link, playerId }: { link: ControllerLink; playerId: string }) {
  return (
    <div className="absolute left-1/2 top-2 z-10 flex -translate-x-1/2 flex-col items-center gap-1 text-xs">
      <div className="font-semibold">
        P{playerId} · {link.connected ? <span className="text-emerald-700">ready</span> : <span className="opacity-60">connecting…</span>}
      </div>
      {link.error && <div className="text-red-700">{link.error}</div>}
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={link.triggerMenuToggle}
        className="rounded-full border border-[#8f8da6] bg-[#e4e4ea] px-3 py-1 font-semibold text-[#3d3a5c]"
        title="Toggle the host menu for saves and library"
      >
        Menu
      </button>
    </div>
  )
}

export function ControllerGates({ link }: { link: ControllerLink }) {
  return (
    <>
      {/* Tap-to-start gate (requests fullscreen + lock) */}
      {!link.started && (
        <button onClick={link.handleStart} className="fixed inset-0 bg-black/90 backdrop-blur flex items-center justify-center p-6 text-center text-white">
          <div className="space-y-3">
            <div className="text-lg font-medium">Tap to start</div>
            <div className="text-sm text-white/70">Enables fullscreen and tries to lock landscape.</div>
          </div>
        </button>
      )}

      {/* Portrait overlay asking to rotate / enable fullscreen (shown after start) */}
      {link.started && link.isPortrait && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur flex items-center justify-center p-6 text-center text-white">
          <div className="space-y-3">
            <div className="text-lg font-medium">Rotate your phone</div>
            <div className="text-sm text-white/70">This controller is best in landscape.</div>
            {link.fsSupported && (
              <button onClick={link.enableFullscreenAndLock} className="mt-1 px-3 py-1.5 rounded bg-white/10 hover:bg-white/20">
                Enable fullscreen & try lock
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}
