"use client"

import { useEffect, useMemo, useRef, useState } from 'react'

type Props = { sessionId: string; playerId: string }

export default function SnesController({ sessionId, playerId }: Props) {
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  const wsUrl = useMemo(() => {
    if (typeof window === 'undefined') return ''
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
    return `${proto}://${window.location.host}/api/snes/${encodeURIComponent(sessionId)}/ws?role=player&playerId=${encodeURIComponent(playerId)}`
  }, [sessionId, playerId])

  useEffect(() => {
    if (!wsUrl) return
    let closed = false
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.addEventListener('open', () => setConnected(true))
    ws.addEventListener('close', () => { setConnected(false); if (!closed) setError('Disconnected') })
    ws.addEventListener('error', () => setError('Connection error'))

    return () => { closed = true; try { ws.close() } catch {} }
  }, [wsUrl])

  function send(control: string, state: 'down' | 'up') {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    try { ws.send(JSON.stringify({ type: 'button', control, state })) } catch {}
  }

  const bind = (control: string) => ({
    onPointerDown: (e: React.PointerEvent) => { (e.target as HTMLElement).setPointerCapture?.(e.pointerId); send(control, 'down') },
    onPointerUp: () => send(control, 'up'),
    onPointerCancel: () => send(control, 'up'),
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  })

  return (
    <div className="min-h-screen p-4 text-white">
      <div className="max-w-md mx-auto space-y-4">
        <h1 className="text-xl font-semibold">SNES Controller · P{playerId}</h1>
        <div className="text-sm text-white/60">Session: <code>{sessionId}</code></div>
        <div className="text-sm">Status: {connected ? <span className="text-emerald-400">connected</span> : <span className="text-white/60">connecting…</span>}</div>
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
    </div>
  )
}

