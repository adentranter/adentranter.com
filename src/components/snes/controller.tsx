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
    // Test vibration on start
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([100, 50, 100]) // Test pattern
      } catch {}
    }
    await enableFullscreenAndLock()
    setStarted(true)
  }

  const playerPrefix = useMemo(() => {
    if (playerId === '1') return 'p1'
    if (playerId === '2') return 'p2'
    return null
  }, [playerId])

  const mapControl = (control: string) => {
    if (control.startsWith('__')) return control
    return playerPrefix ? `${playerPrefix}_${control}` : control
  }

  function send(control: string, state: 'down' | 'up') {
    const payload = { type: 'button', control: mapControl(control), state }
    console.log('[Controller] Sending:', payload, 'to:', pushUrl)

    if (pushUrl) {
      fetch(pushUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
        .then(res => {
          console.log('[Controller] Response:', res.status, res.ok)
          if (!res.ok) console.error('[Controller] Failed to send:', res.statusText)
        })
        .catch(err => {
          console.error('[Controller] Network error:', err)
        })
    }
    
    // Haptic feedback on button press
    if (state === 'down' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(50) // Short vibration
      } catch {}
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
      <div className="h-[100dvh] flex flex-col">
        {/* Shoulder Buttons - Full width bars at top - SNES Colors */}
        <div className="grid grid-cols-2 h-12">
          <button className="bg-gray-400/80 active:bg-gray-400 text-sm font-bold flex items-center justify-center text-gray-800" {...bind('l')}>L</button>
          <button className="bg-gray-400/80 active:bg-gray-400 text-sm font-bold flex items-center justify-center text-gray-800" {...bind('r')}>R</button>
        </div>

        {/* Main Controller Area - Takes up most of the screen */}
        <div className="flex-1 flex items-center justify-center px-6 py-4">
          <div className="w-full max-w-lg flex items-center justify-between">
            {/* D-Pad - Left side - MUCH LARGER - SNES Colors */}
            <div className="flex flex-col items-center">
              <div className="grid grid-rows-3 grid-cols-3 gap-2 w-40 h-40">
                <div />
                <button className="rounded-xl bg-gray-300/80 active:bg-gray-300 text-2xl font-bold flex items-center justify-center text-gray-800" {...bind('up')}>↑</button>
                <div />
                <button className="rounded-xl bg-gray-300/80 active:bg-gray-300 text-2xl font-bold flex items-center justify-center text-gray-800" {...bind('left')}>←</button>
                <div />
                <button className="rounded-xl bg-gray-300/80 active:bg-gray-300 text-2xl font-bold flex items-center justify-center text-gray-800" {...bind('right')}>→</button>
                <div />
                <button className="rounded-xl bg-gray-300/80 active:bg-gray-300 text-2xl font-bold flex items-center justify-center text-gray-800" {...bind('down')}>↓</button>
                <div />
              </div>
            </div>

            {/* ABXY - Right side - MUCH LARGER - SNES Colors */}
            <div className="flex flex-col items-center">
              <div className="grid grid-rows-3 grid-cols-3 gap-2 w-40 h-40">
                <div />
                <button className="rounded-xl bg-purple-500/80 active:bg-purple-500 text-2xl font-bold flex items-center justify-center text-white" {...bind('x')}>X</button>
                <div />
                <button className="rounded-xl bg-yellow-500/80 active:bg-yellow-500 text-2xl font-bold flex items-center justify-center text-white" {...bind('y')}>Y</button>
                <div />
                <button className="rounded-xl bg-green-500/80 active:bg-green-500 text-2xl font-bold flex items-center justify-center text-white" {...bind('a')}>A</button>
                <div />
                <button className="rounded-xl bg-red-500/80 active:bg-red-500 text-2xl font-bold flex items-center justify-center text-white" {...bind('b')}>B</button>
                <div />
              </div>
            </div>
          </div>
        </div>

        {/* Start/Select - Small buttons at bottom - SNES Colors */}
        <div className="grid grid-cols-2 h-10 px-4 pb-2">
          <button className="bg-gray-500/80 active:bg-gray-500 text-xs font-medium flex items-center justify-center text-white" {...bind('select')}>Select</button>
          <button className="bg-gray-500/80 active:bg-gray-500 text-xs font-medium flex items-center justify-center text-white" {...bind('start')}>Start</button>
        </div>

        {/* Status overlay - Small and unobtrusive */}
        <div className="absolute top-14 left-2 text-xs text-white/60">
          <div>P{playerId} • {connected ? <span className="text-emerald-400">ready</span> : <span className="text-white/60">connecting…</span>}</div>
          {error && <div className="text-red-400">{error}</div>}
          <button 
            onClick={() => send('a', 'down')} 
            className="mt-1 px-2 py-1 bg-red-500 text-white text-xs rounded"
          >
            Test A
          </button>
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
