"use client"

import { useEffect, useMemo, useRef, useState } from 'react'

type Props = { sessionId: string; playerId: string }

export default function SnesController({ sessionId, playerId }: Props) {
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const [isPortrait, setIsPortrait] = useState(false)
  const [fsSupported, setFsSupported] = useState(false)
  const [orientationLocked, setOrientationLocked] = useState(false)
  const [started, setStarted] = useState(false)
  const transportPref = (process.env.NEXT_PUBLIC_SNES_TRANSPORT || 'auto').toLowerCase() as 'auto' | 'sse'

  const wsUrl = useMemo(() => {
    if (typeof window === 'undefined') return ''
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
    return `${proto}://${window.location.host}/api/snes/${encodeURIComponent(sessionId)}/ws?role=player&playerId=${encodeURIComponent(playerId)}`
  }, [sessionId, playerId])
  const pushUrl = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return `/api/snes/${encodeURIComponent(sessionId)}/push?playerId=${encodeURIComponent(playerId)}`
  }, [sessionId, playerId])

  useEffect(() => {
    if (!wsUrl) return
    if (transportPref === 'sse') { setConnected(true); return }
    let closed = false
    console.log('[snes] WS(player) connecting', wsUrl)
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.addEventListener('open', () => { console.log('[snes] WS(player) open'); setConnected(true) })
    ws.addEventListener('close', () => { console.log('[snes] WS(player) closed'); setConnected(false); if (!closed) setError('Disconnected') })
    ws.addEventListener('error', () => { console.warn('[snes] WS(player) error'); setError('Connection error') })

    return () => { closed = true; try { ws.close() } catch {} }
  }, [wsUrl, transportPref])

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
    const ws = wsRef.current
    const payload = { type: 'button', control, state }
    if (transportPref !== 'sse' && ws && ws.readyState === WebSocket.OPEN) {
      try { ws.send(JSON.stringify(payload)) } catch {}
    } else {
      // Fallback: POST to SSE push endpoint
      if (pushUrl) {
        fetch(pushUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
          .catch(() => {})
      }
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
        <div className="text-sm">Status: {connected ? <span className="text-emerald-400">{transportPref === 'sse' ? 'sse' : 'connected'}</span> : <span className="text-white/60">connecting…</span>}</div>
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
