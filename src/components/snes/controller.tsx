"use client"

import { useEffect, useMemo, useRef, useState } from 'react'

type Props = { sessionId: string; playerId: string }

export default function SnesController({ sessionId, playerId }: Props) {
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPortrait, setIsPortrait] = useState(false)
  const [fsSupported, setFsSupported] = useState(false)
  const [orientationLocked, setOrientationLocked] = useState(false)
  const [started, setStarted] = useState(false)

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
        setOrientationLocked(true)
      }
    } catch {
      // orientation lock might be disallowed until PWA install; ignore
    }
  }

  async function handleStart() {
    await enableFullscreenAndLock()
    setStarted(true)
  }

  function send(control: string, state: 'down' | 'up') {
    const payload = { type: 'button', control, state }
    if (pushUrl) {
      fetch(pushUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
        .catch(() => {})
    }
  }

  const bind = (control: string) => ({
    onPointerDown: (e: React.PointerEvent) => { (e.target as HTMLElement).setPointerCapture?.(e.pointerId); send(control, 'down') },
    onPointerUp: () => send(control, 'up'),
    onPointerCancel: () => send(control, 'up'),
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  })

  return (
    <div className="fixed inset-0 overflow-hidden bg-black text-white touch-none">
      <div className="max-w-md mx-auto p-4 space-y-4 h-[100dvh]">
        <h1 className="text-xl font-semibold">SNES Controller · P{playerId}</h1>
        <div className="text-sm text-white/60">Session: <code>{sessionId}</code></div>
        <div className="text-sm">Status: {connected ? <span className="text-emerald-400">ready</span> : <span className="text-white/60">connecting…</span>}</div>
        {error && <div className="text-sm text-red-400">{error}</div>}

        {/* D-Pad + ABXY */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          {/* D-Pad */}
          <div className="grid grid-rows-3 grid-cols-3 gap-2 select-none">
            <div />
            <button className="py-4 rounded bg-white/10 active:bg-white/20" {...bind('up')}>Up</button>
            <div />
            <button className="py-4 rounded bg-white/10 active:bg-white/20" {...bind('left')}>Left</button>
            <div />
            <button className="py-4 rounded bg-white/10 active:bg-white/20" {...bind('right')}>Right</button>
            <div />
            <button className="py-4 rounded bg-white/10 active:bg-white/20" {...bind('down')}>Down</button>
            <div />
          </div>

          {/* ABXY */}
          <div className="grid grid-rows-3 grid-cols-3 gap-2 select-none">
            <div />
            <button className="py-4 rounded bg-primary/30 active:bg-primary" {...bind('x')}>X</button>
            <div />
            <button className="py-4 rounded bg-primary/30 active:bg-primary" {...bind('y')}>Y</button>
            <div />
            <button className="py-4 rounded bg-primary/30 active:bg-primary" {...bind('a')}>A</button>
            <div />
            <button className="py-4 rounded bg-primary/30 active:bg-primary" {...bind('b')}>B</button>
            <div />
          </div>
        </div>

        {/* Shoulder + Start/Select */}
        <div className="grid grid-cols-2 gap-3 mt-4 select-none">
          <button className="py-2 rounded bg-white/10 active:bg-white/20" {...bind('l')}>L</button>
          <button className="py-2 rounded bg-white/10 active:bg-white/20" {...bind('r')}>R</button>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-2 select-none">
          <button className="py-2 rounded bg-white/10 active:bg-white/20" {...bind('select')}>Select</button>
          <button className="py-2 rounded bg-white/10 active:bg-white/20" {...bind('start')}>Start</button>
        </div>
      </div>

      {/* Tap-to-start gate (requests fullscreen + lock) */}
      {!started && (
        <button onClick={handleStart} className="fixed inset-0 bg-black/90 backdrop-blur flex items-center justify-center p-6 text-center">
          <div className="space-y-3">
            <div className="text-lg font-medium">Tap to start</div>
            <div className="text-sm text-white/70">Enables fullscreen and tries to lock landscape.</div>
          </div>
        </button>
      )}

      {/* Portrait overlay asking to rotate / enable fullscreen (shown after start) */}
      {started && isPortrait && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur flex items-center justify-center p-6 text-center">
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
