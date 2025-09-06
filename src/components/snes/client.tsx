"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Pusher from 'pusher-js'
import { deleteRom, getRom, listRoms, putRom, type StoredRomMeta } from "@/lib/idb-roms"

type RemoteRom = { name: string; url: string }

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  const units = ["KB", "MB", "GB"]
  let i = -1
  do { bytes = bytes / 1024; i++ } while (bytes >= 1024 && i < units.length - 1)
  return `${bytes.toFixed(1)} ${units[i]}`
}

export default function SnesClient(props: { sessionId?: string }) {
  const [roms, setRoms] = useState<StoredRomMeta[]>([])
  const [loading, setLoading] = useState(false)
  const [activeRomLocal, setActiveRomLocal] = useState<string | null>(null)
  const [activeRomRemote, setActiveRomRemote] = useState<RemoteRom | null>(null)
  const [status, setStatus] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [mounted, setMounted] = useState(false)
  const [search, setSearch] = useState("")
  const [remoteRoms, setRemoteRoms] = useState<RemoteRom[] | null>(null)
  const [remoteError, setRemoteError] = useState<string | null>(null)
  const gameViewRef = useRef<HTMLDivElement | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const [sessionId, setSessionId] = useState<string | null>(props.sessionId || null)
  const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY
  const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER
  const usePusher = !!pusherKey && !!pusherCluster
  const [pusherStatus, setPusherStatus] = useState<'idle' | 'subscribing' | 'subscribed' | 'error'>('idle')
  
  // Debug Pusher env vars
  useEffect(() => {
    console.log('[Pusher Debug]', {
      pusherKey: pusherKey ? `${pusherKey.substring(0, 8)}...` : 'MISSING',
      pusherCluster: pusherCluster || 'MISSING',
      usePusher,
      sessionId
    })
  }, [pusherKey, pusherCluster, usePusher, sessionId])
  const [controllerCount, setControllerCount] = useState<number>(0)
  const pusherRef = useRef<Pusher | null>(null)

  // Two-player key mapping for keyboard controls
  const keymap: Record<string, string> = {
    // Player 1 controls (WASD + additional keys)
    'p1_up': 'KeyW',
    'p1_down': 'KeyS', 
    'p1_left': 'KeyA',
    'p1_right': 'KeyD',
    'p1_a': 'KeyX',
    'p1_b': 'KeyZ',
    'p1_x': 'KeyC',
    'p1_y': 'KeyV',
    'p1_l': 'KeyQ',
    'p1_r': 'KeyE',
    'p1_start': 'Enter',
    'p1_select': 'ShiftLeft',
    
    // Player 2 controls (Arrow keys + additional keys)
    'p2_up': 'ArrowUp',
    'p2_down': 'ArrowDown',
    'p2_left': 'ArrowLeft', 
    'p2_right': 'ArrowRight',
    'p2_a': 'KeyI',
    'p2_b': 'KeyO',
    'p2_x': 'KeyK',
    'p2_y': 'KeyL',
    'p2_l': 'KeyU',
    'p2_r': 'KeyP',
    'p2_start': 'Space',
    'p2_select': 'ShiftRight',
    
    // Legacy single-player mapping (for backward compatibility)
    up: 'ArrowUp',
    down: 'ArrowDown',
    left: 'ArrowLeft',
    right: 'ArrowRight',
    a: 'KeyX',
    b: 'KeyZ',
    x: 'KeyS',
    y: 'KeyA',
    l: 'KeyQ',
    r: 'KeyW',
    start: 'Enter',
    select: 'ShiftRight',
  }

  function emit(control: string, state: 'down' | 'up') {
    const code = keymap[control]
    if (!code) {
      console.warn('[Controller] Unknown control:', control)
      return
    }
    const type = state === 'down' ? 'keydown' : 'keyup'
    let key: string | undefined
    if (code.startsWith('Key')) key = code.slice(3).toLowerCase()
    else if (code.startsWith('Arrow')) key = code
    else if (code.startsWith('Shift')) key = 'Shift'
    else if (code === 'Enter') key = 'Enter'
    else if (code === 'Space') key = ' '
    
    console.log('[Controller] Emitting:', { control, state, key, code, type })
    
    // Create a single, clean keyboard event
    const ev = new KeyboardEvent(type, { 
      key, 
      code, 
      bubbles: true, 
      cancelable: true,
      composed: true
    })
    
    // Only dispatch to the focused emulator element
    const canvas = document.querySelector('canvas')
    const iframe = document.querySelector('iframe')
    
    if (canvas && document.activeElement === canvas) {
      canvas.dispatchEvent(ev)
    } else if (iframe && document.activeElement === iframe) {
      iframe.dispatchEvent(ev)
    } else {
      // Fallback: dispatch to window but don't interfere with EmulatorJS
      window.dispatchEvent(ev)
    }
  }

  // Generate a per-tab session id when not provided from route
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (props.sessionId) return
    const sid = (crypto as any)?.randomUUID?.() || Math.random().toString(36).slice(2)
    setSessionId(sid)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const controllerBase = useMemo(() => {
    if (typeof window === 'undefined' || !sessionId) return ''
    const envHost = process.env.NEXT_PUBLIC_SNES_HOST
    const envProto = process.env.NEXT_PUBLIC_SNES_PROTOCOL
    const envPort = process.env.NEXT_PUBLIC_SNES_PORT
    const origin = envHost
      ? `${envProto || (window.location.protocol.replace(':',''))}://${envHost}${envPort ? `:${envPort}` : ''}`
      : window.location.origin
    return `${origin}/snes/${encodeURIComponent(sessionId)}/player/`
  }, [sessionId])
  const qr1 = useMemo(() => controllerBase ? `/api/qr?size=180&text=${encodeURIComponent(controllerBase + '1')}` : '', [controllerBase])
  const qr2 = useMemo(() => controllerBase ? `/api/qr?size=180&text=${encodeURIComponent(controllerBase + '2')}` : '', [controllerBase])

  useEffect(() => { setMounted(true); (async () => setRoms(await listRoms()))() }, [])

  // Fetch remote ROM manifest (replaces inline component)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      async function tryFetch(url: string) {
        const res = await fetch(url, { cache: 'no-store' })
        if (!res.ok) throw new Error(`${res.status}`)
        return res.json()
      }
      try {
        let data: any
        try { data = await tryFetch('/snes/roms.json') } catch { /* ignore */ }
        if (!data) { data = await tryFetch('/api/roms') }
        if (!cancelled) setRemoteRoms(Array.isArray(data) ? data : [])
      } catch (e: any) {
        if (!cancelled) setRemoteError(e?.message || 'Failed to load manifest')
      }
    })()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!mounted) return
    const usingLocal = !!activeRomLocal
    const usingRemote = !!activeRomRemote
    if (!usingLocal && !usingRemote) return
    let cancelled = false
    ;(async () => {
      setStatus('Loading ROM…')
      let url: string
      let gameName = ''
      if (usingLocal) {
        const found = await getRom(activeRomLocal!)
        if (!found) { setStatus('ROM not found'); return }
        const { blob } = found
        url = URL.createObjectURL(blob)
        gameName = activeRomLocal!
      } else {
        url = activeRomRemote!.url
        gameName = activeRomRemote!.name
      }
      const w = window as any
      w.EJS_player = '#ejs-container'
      w.EJS_core = 'snes'
      w.EJS_gameName = gameName
      w.EJS_pathtodata = 'https://cdn.emulatorjs.org/latest/data/'
      w.EJS_gameUrl = url
      w.EJS_mobileDevices = true
      
      // Configure for two-player keyboard support
      w.EJS_controls = {
        // Player 1 controls (WASD + additional keys)
        'p1_up': 'KeyW',
        'p1_down': 'KeyS',
        'p1_left': 'KeyA', 
        'p1_right': 'KeyD',
        'p1_a': 'KeyX',
        'p1_b': 'KeyZ',
        'p1_x': 'KeyC',
        'p1_y': 'KeyV',
        'p1_l': 'KeyQ',
        'p1_r': 'KeyE',
        'p1_start': 'Enter',
        'p1_select': 'ShiftLeft',
        
        // Player 2 controls (Arrow keys + additional keys)
        'p2_up': 'ArrowUp',
        'p2_down': 'ArrowDown',
        'p2_left': 'ArrowLeft',
        'p2_right': 'ArrowRight', 
        'p2_a': 'KeyI',
        'p2_b': 'KeyO',
        'p2_x': 'KeyK',
        'p2_y': 'KeyL',
        'p2_l': 'KeyU',
        'p2_r': 'KeyP',
        'p2_start': 'Space',
        'p2_select': 'ShiftRight'
      }
      
      // Enable keyboard controls
      w.EJS_keyboardControls = true

      const ensureLoader = () => new Promise<void>((resolve, reject) => {
        if ((window as any).EJS_Loaded) { resolve(); return }
        const existing = document.querySelector('script[data-ejs-loader]') as HTMLScriptElement | null
        if (existing) {
          existing.addEventListener('load', () => resolve())
          existing.addEventListener('error', () => reject(new Error('Failed to load EmulatorJS loader')))
          return
        }
        const s = document.createElement('script')
        s.src = 'https://cdn.emulatorjs.org/latest/data/loader.js'
        s.async = true
        s.dataset.ejsLoader = 'true'
        s.onload = () => resolve()
        s.onerror = () => reject(new Error('Failed to load EmulatorJS loader'))
        document.body.appendChild(s)
      })

      try {
        await ensureLoader()
        setStatus('Starting emulator…')
        const container = document.getElementById('ejs-container')
        if (container) container.innerHTML = ''
        
        // Wait for emulator to load and then focus it
        setTimeout(() => {
          const canvas = document.querySelector('canvas')
          const iframe = document.querySelector('iframe')
          if (canvas) {
            canvas.focus()
            console.log('[Emulator] Focused canvas')
          } else if (iframe) {
            iframe.focus()
            console.log('[Emulator] Focused iframe')
          }
          setStatus('')
        }, 1000)
      } catch (e: any) {
        console.error(e); setStatus(e?.message || 'Failed to start emulator')
      }
    })()
    return () => { cancelled = true }
  }, [activeRomLocal, activeRomRemote, mounted])

  // Keyboard event listeners for two-player support
  useEffect(() => {
    if (!mounted) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent default behavior for game keys to avoid browser shortcuts
      const gameKeys = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyX', 'KeyZ', 'KeyC', 'KeyV', 'KeyQ', 'KeyE', 'KeyI', 'KeyO', 'KeyK', 'KeyL', 'KeyU', 'KeyP', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Space', 'ShiftLeft', 'ShiftRight']
      if (gameKeys.includes(event.code)) {
        event.preventDefault()
      }
      
      // Map keyboard events to control names for Pusher forwarding
      const controlMap: Record<string, string> = {
        'KeyW': 'p1_up',
        'KeyS': 'p1_down', 
        'KeyA': 'p1_left',
        'KeyD': 'p1_right',
        'KeyX': 'p1_a',
        'KeyZ': 'p1_b',
        'KeyC': 'p1_x',
        'KeyV': 'p1_y',
        'KeyQ': 'p1_l',
        'KeyE': 'p1_r',
        'Enter': 'p1_start',
        'ShiftLeft': 'p1_select',
        
        'ArrowUp': 'p2_up',
        'ArrowDown': 'p2_down',
        'ArrowLeft': 'p2_left',
        'ArrowRight': 'p2_right',
        'KeyI': 'p2_a',
        'KeyO': 'p2_b',
        'KeyK': 'p2_x',
        'KeyL': 'p2_y',
        'KeyU': 'p2_l',
        'KeyP': 'p2_r',
        'Space': 'p2_start',
        'ShiftRight': 'p2_select'
      }
      
      const control = controlMap[event.code]
      if (control) {
        console.log('[Keyboard] Player input:', { control, state: 'down', code: event.code })
        // Forward to Pusher if connected
        if (pusherRef.current && sessionId) {
          const pushUrl = `/api/snes/${encodeURIComponent(sessionId)}/push?playerId=keyboard`
          fetch(pushUrl, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ type: 'button', control, state: 'down' })
          }).catch(err => console.error('[Keyboard] Failed to send to Pusher:', err))
        }
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      const controlMap: Record<string, string> = {
        'KeyW': 'p1_up',
        'KeyS': 'p1_down', 
        'KeyA': 'p1_left',
        'KeyD': 'p1_right',
        'KeyX': 'p1_a',
        'KeyZ': 'p1_b',
        'KeyC': 'p1_x',
        'KeyV': 'p1_y',
        'KeyQ': 'p1_l',
        'KeyE': 'p1_r',
        'Enter': 'p1_start',
        'ShiftLeft': 'p1_select',
        
        'ArrowUp': 'p2_up',
        'ArrowDown': 'p2_down',
        'ArrowLeft': 'p2_left',
        'ArrowRight': 'p2_right',
        'KeyI': 'p2_a',
        'KeyO': 'p2_b',
        'KeyK': 'p2_x',
        'KeyL': 'p2_y',
        'KeyU': 'p2_l',
        'KeyP': 'p2_r',
        'Space': 'p2_start',
        'ShiftRight': 'p2_select'
      }
      
      const control = controlMap[event.code]
      if (control) {
        console.log('[Keyboard] Player input:', { control, state: 'up', code: event.code })
        // Forward to Pusher if connected
        if (pusherRef.current && sessionId) {
          const pushUrl = `/api/snes/${encodeURIComponent(sessionId)}/push?playerId=keyboard`
          fetch(pushUrl, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ type: 'button', control, state: 'up' })
          }).catch(err => console.error('[Keyboard] Failed to send to Pusher:', err))
        }
      }
    }

    // Add event listeners to the document to capture all keyboard input
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [mounted, sessionId])

  // Fullscreen handling
  useEffect(() => {
    const handler = () => {
      const fs = !!document.fullscreenElement
      setIsFullscreen(fs)
    }
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  // Pusher subscription only
  useEffect(() => {
    if (typeof window === 'undefined' || !sessionId) return
    if (!usePusher) return
    setPusherStatus('subscribing')
    const p = new Pusher(pusherKey!, { cluster: pusherCluster!, forceTLS: true, enableStats: true, wsHost: undefined })
    pusherRef.current = p
    const channelName = `snes-${sessionId}`
    const ch = p.subscribe(channelName)
    ch.bind('pusher:subscription_succeeded', () => setPusherStatus('subscribed'))
    ch.bind('pusher:connection_established', () => console.debug('[pusher] connection established'))
    ch.bind('pusher:error', (err: any) => { console.error('[pusher] error', err); setPusherStatus('error') })
    p.connection.bind('state_change', (states: any) => { console.debug('[pusher] state', states) })
    p.connection.bind('error', (err: any) => { console.error('[pusher] conn error', err) })
    ch.bind('input', (data: any) => {
      console.log('[Pusher] Received input:', data)
      if (data?.type === 'input' && data?.input?.type === 'button') {
        const { control, state } = data.input
        if ((state === 'down' || state === 'up') && typeof control === 'string') {
          console.log('[Pusher] Processing button:', { control, state })
          emit(control, state)
        }
      }
    })
    ch.bind('pusher:subscription_error', (err: any) => { console.error('[pusher] sub error', err); setPusherStatus('error') })
    ch.bind('hello', (data: any) => {
      // naive increment; in a real app track unique controller ids
      setControllerCount((n) => n + 1)
      console.debug('[pusher] hello', data)
    })
    return () => {
      try { ch.unbind_all(); p.unsubscribe(channelName); p.disconnect() } catch {}
      pusherRef.current = null
      setPusherStatus('idle')
    }
  }, [sessionId, usePusher, pusherKey, pusherCluster])

  // (WS/SSE removed)

  const toggleFullscreen = async () => {
    const el = gameViewRef.current
    if (!el) return
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen()
      } else if (document.fullscreenElement) {
        await document.exitFullscreen()
      }
    } catch {}
  }

  async function handleFiles(files: FileList | null) {
    if (!files || !files.length) return
    setLoading(true)
    try {
      for (const f of Array.from(files)) { await putRom(f) }
      setRoms(await listRoms())
    } finally { setLoading(false) }
  }

  function onDrop(e: React.DragEvent) { e.preventDefault(); e.stopPropagation(); handleFiles(e.dataTransfer.files) }

  // Name helpers
  const stripExt = (name: string) => name.replace(/\.(smc|sfc|zip|7z|fig|swc)$/i, '')
  const prettifyName = (name: string) =>
    stripExt(name)
      // remove trailing (1), (2) etc
      .replace(/\s*\((\d+)\)\s*$/i, '')
      // remove region/extra tags like (USA), [!], [v1.0], etc
      .replace(/\s*[\[(].*?[\])]\s*/g, ' ')
      .replace(/[._]+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()

  const searchKey = (name: string) =>
    prettifyName(name)
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')

  const searchLower = searchKey(search)
  const matches = (s: string) => searchLower.length === 0 || searchKey(s).includes(searchLower)
  const filteredLocal = roms.filter(r => matches(r.name))
  const filteredRemote = (remoteRoms || []).filter(r => matches(r.name) || matches(r.url))

  if (!mounted) {
    return (
      <div className="py-6 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold">SNES</h1>
          <div className="text-sm text-white/60">Loading...</div>
        </div>
        <div className="space-y-3">
          <div className="rounded-lg bg-black/50 border border-white/10 p-2 relative">
            <div className="aspect-video w-full bg-black flex items-center justify-center">
              <div className="text-white/50">Loading emulator...</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-6 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
      {/* Left column: Lists (with search above local games) */}
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">SNES</h1>

        {/* Local Library */}
        <div className="space-y-2">
          <h2 className="text-lg font-medium">Your Library</h2>
          {/* Search above uploaded games */}
          <div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search games…"
              className="w-full rounded-md bg-white/10 px-3 py-2 text-sm outline-none"
            />
          </div>
          {roms.length === 0 && (<p className="text-sm text-white/50">No ROMs yet. Upload on the right.</p>)}
          <ul className="min-h-[80vh] overflow-auto divide-y divide-white/10 rounded border border-white/10">
            {filteredLocal.map((r) => (
              <li key={r.name} className="p-3 flex items-center justify-between gap-3">
                <button className="text-left flex-1 hover:text-primary" onClick={() => { setActiveRomRemote(null); setActiveRomLocal(r.name) }} title="Load in emulator">
                  <div className="font-medium truncate">{prettifyName(r.name)}</div>
                  <div className="text-xs text-white/50">{formatSize(r.size)} · {new Date(r.addedAt).toLocaleString()}</div>
                </button>
                <button className="text-xs text-white/60 hover:text-red-400" title="Delete from library" onClick={async () => { await deleteRom(r.name); setRoms(await listRoms()); if (activeRomLocal === r.name) setActiveRomLocal(null) }}>remove</button>
              </li>
            ))}
          </ul>
        </div>

        {/* Remote Library */}
        {!!remoteError && <p className="text-xs text-red-400">{remoteError}</p>}
        {remoteRoms && remoteRoms.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-lg font-medium">Remote Library</h2>
            <p className="text-xs text-white/60">Files served from <code>/public/roms</code> or <code>/public/snes</code>.</p>
            <ul className="max-h-[30vh] overflow-auto divide-y divide-white/10 rounded border border-white/10">
              {filteredRemote.map((r) => (
                <li key={r.url} className="p-3 flex items-center justify-between gap-3">
                  <button className="text-left flex-1 hover:text-primary" onClick={() => { setActiveRomLocal(null); setActiveRomRemote(r) }} title="Stream in emulator">
                    <div className="font-medium truncate">{prettifyName(r.name)}</div>
                    <div className="text-xs text-white/50 truncate">{r.url}</div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Right column: Game view + bottom bar */}
      <div className="space-y-3">
        <div ref={gameViewRef} className="rounded-lg bg-black/50 border border-white/10 p-2 relative">
          <div 
            id="ejs-container" 
            className="aspect-video w-full bg-black cursor-pointer" 
            onClick={() => {
              // Focus the emulator when clicked
              const canvas = document.querySelector('canvas')
              const iframe = document.querySelector('iframe')
              if (canvas) {
                canvas.focus()
                console.log('[Emulator] Focused canvas via click')
              } else if (iframe) {
                iframe.focus()
                console.log('[Emulator] Focused iframe via click')
              }
            }}
          />
          <button
            onClick={toggleFullscreen}
            className="absolute right-3 bottom-3 px-2.5 py-1.5 text-xs rounded bg-white/10 hover:bg-white/20 text-white"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? 'Exit FS' : 'FS'}
          </button>
        </div>
        {status && <div className="text-sm text-white/70">{status}</div>}
        <div className="text-xs text-white/50">
          Pusher: {pusherStatus}
          {!usePusher && <span className="text-red-400"> (env vars missing)</span>}
          {usePusher && pusherStatus === 'idle' && <span className="text-yellow-400"> (connecting...)</span>}
          · Controllers: {controllerCount}
        </div>
        {!activeRomLocal && !activeRomRemote && (<div className="text-sm text-white/60">Select a ROM from the left to start playing.</div>)}
        
        {/* Keyboard Controls Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-white/60">
          <div className="space-y-1">
            <div className="font-medium text-white/80">Player 1 (WASD)</div>
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              <div>WASD - Move</div>
              <div>XZCV - ABXY</div>
              <div>QE - L/R</div>
              <div>Enter/Shift - Start/Select</div>
            </div>
          </div>
          <div className="space-y-1">
            <div className="font-medium text-white/80">Player 2 (Arrow Keys)</div>
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              <div>Arrows - Move</div>
              <div>IKLO - ABXY</div>
              <div>UP - L/R</div>
              <div>Space/Shift - Start/Select</div>
            </div>
          </div>
        </div>
        
        <div className="text-[11px] text-white/40">Note: Only load ROMs you own rights to. Local files are not uploaded.</div>

        {/* Bottom row: QR codes + Upload */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start pt-2 border-t border-white/10">
          {/* QR codes (two columns on md) */}
          <div className="md:col-span-2 grid grid-cols-2 gap-3">
            <div className="rounded border border-white/10 p-2 text-center">
              <div className="text-xs mb-1">Player 1</div>
              {qr1 ? (
                <img src={qr1} alt="Player 1 QR" className="mx-auto" />
              ) : (
                <div className="text-xs text-white/50">Loading…</div>
              )}
              {controllerBase && (
                <div className="mt-1 text-[10px] text-white/40 break-all">{controllerBase + '1'}</div>
              )}
            </div>
            <div className="rounded border border-white/10 p-2 text-center">
              <div className="text-xs mb-1">Player 2</div>
              {qr2 ? (
                <img src={qr2} alt="Player 2 QR" className="mx-auto" />
              ) : (
                <div className="text-xs text-white/50">Loading…</div>
              )}
              {controllerBase && (
                <div className="mt-1 text-[10px] text-white/40 break-all">{controllerBase + '2'}</div>
              )}
            </div>
          </div>
          {/* Upload area */}
          <div
            className="rounded-md border border-dashed border-white/20 p-4 text-sm text-white/70 hover:border-white/40 transition-colors"
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' }}
            onDrop={onDrop}
          >
            <p className="mb-2">Drag and drop ROMs here</p>
            <button className="px-3 py-1.5 rounded bg-primary/20 hover:bg-primary text-white" onClick={() => fileInputRef.current?.click()} disabled={loading}>{loading ? 'Adding…' : 'Add ROMs'}</button>
            <input ref={fileInputRef} type="file" accept=".smc,.sfc,.fig,.swc,.zip,.7z,application/zip,application/x-7z-compressed,application/octet-stream" multiple className="hidden" onChange={(e) => handleFiles(e.currentTarget.files)} />
            <p className="mt-2 text-xs text-white/50">Stored locally via IndexedDB; progress stays in this browser.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
