"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Pusher from 'pusher-js'
import { deleteRom, getRom, listRoms, putRom, type StoredRomMeta } from "@/lib/idb-roms"

type RemoteRom = { name: string; url: string }

type EmulatorMethodCandidate = { name: string; args?: any[] }

type GlobalAction = 'back' | 'save' | 'load'

const SAVE_METHOD_CANDIDATES: EmulatorMethodCandidate[] = [
  { name: 'saveState' },
  { name: 'saveStateSlot', args: [0] },
  { name: 'saveStateFile' },
  { name: 'saveStateToLocalStorage' },
  { name: 'quickSave' }
]

const LOAD_METHOD_CANDIDATES: EmulatorMethodCandidate[] = [
  { name: 'loadState' },
  { name: 'loadStateSlot', args: [0] },
  { name: 'loadStateFile' },
  { name: 'loadStateFromLocalStorage' },
  { name: 'quickLoad' }
]

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
  
  // Game selection state for controller navigation
  const [selectedGameIndex, setSelectedGameIndex] = useState<number>(0)
  const [selectedGameType, setSelectedGameType] = useState<'local' | 'remote'>('local')
  const [gameScreenshots, setGameScreenshots] = useState<Record<string, string>>({})
  const [isNavigatingGames, setIsNavigatingGames] = useState(false)
  
  // Multi-stage interface state
  const [interfaceStage, setInterfaceStage] = useState<'landing' | 'qr' | 'gameSelection' | 'emulator'>('landing')
  const [selectedInputMethod, setSelectedInputMethod] = useState<'keyboard' | 'phone' | null>(null)
  const [hasControllerConnected, setHasControllerConnected] = useState(false)
  const [landingSelection, setLandingSelection] = useState<'keyboard' | 'phone'>('keyboard')

  const [globalMenuOpen, setGlobalMenuOpen] = useState(false)
  const [globalMenuIndex, setGlobalMenuIndex] = useState(0)
  const [globalMenuStatus, setGlobalMenuStatus] = useState<string | null>(null)
  const [globalActionBusy, setGlobalActionBusy] = useState(false)

  const globalMenuOptions = useMemo(
    () => [
      {
        id: 'back' as GlobalAction,
        label: 'Back to game library',
        description: 'Close the emulator and return to the save/game picker.'
      },
      {
        id: 'save' as GlobalAction,
        label: 'Save game state',
        description: 'Snapshot progress to this browser so you can continue later.'
      },
      {
        id: 'load' as GlobalAction,
        label: 'Load last save',
        description: 'Restore the most recent save state captured on this device.'
      }
    ],
    []
  )

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
    if (control === '__hello') return
    if (control === '__menu') {
      if (state === 'down') {
        setGlobalMenuOpen(prev => {
          const next = !prev
          if (next) {
            setGlobalMenuIndex(0)
            setGlobalMenuStatus(null)
          }
          return next
        })
      }
      return
    }
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
    const canvas = document.querySelector('#ejs-container canvas') as HTMLCanvasElement | null
    const iframe = document.querySelector('#ejs-container iframe') as HTMLIFrameElement | null

    let dispatched = false

    if (canvas) {
      try { canvas.focus() } catch {}
      try { canvas.dispatchEvent(ev); dispatched = true } catch (error) {
        console.warn('[Controller] Failed to dispatch to canvas', error)
      }
    }

    if (iframe) {
      try { iframe.focus() } catch {}
      try { iframe.dispatchEvent(ev); dispatched = true } catch (error) {
        console.warn('[Controller] Failed to dispatch to iframe element', error)
      }
      try {
        iframe.contentWindow?.dispatchEvent(ev)
        dispatched = true
      } catch (error) {
        console.warn('[Controller] Failed to dispatch to iframe window', error)
      }
    }

    // Always mirror the event onto document/window to satisfy EmulatorJS listeners
    try { window.dispatchEvent(ev) } catch (error) { console.warn('[Controller] Failed to dispatch to window', error) }
    try { document.dispatchEvent(ev) } catch (error) { console.warn('[Controller] Failed to dispatch to document', error) }

    if (!dispatched) {
      console.warn('[Controller] No emulator target detected for event', { control, state })
    }
  }

  // Screenshot capture function
  const captureGameScreenshot = async (gameName: string) => {
    try {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement
      if (!canvas) return
      
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob)
        }, 'image/png', 0.8)
      })
      
      if (blob) {
        const url = URL.createObjectURL(blob)
        setGameScreenshots(prev => ({ ...prev, [gameName]: url }))
        console.log('[Screenshot] Captured for:', gameName)
      }
    } catch (error) {
      console.error('[Screenshot] Failed to capture:', error)
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

  useEffect(() => {
    if (interfaceStage === 'landing') {
      setLandingSelection(selectedInputMethod ?? 'keyboard')
    }
  }, [interfaceStage, selectedInputMethod])

  useEffect(() => {
    if (interfaceStage !== 'emulator' && globalMenuOpen) {
      setGlobalMenuOpen(false)
      setGlobalMenuStatus(null)
    }
  }, [interfaceStage, globalMenuOpen])

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
          
          // Capture screenshot after emulator loads
          setTimeout(() => {
            captureGameScreenshot(gameName)
          }, 3000) // Wait 3 seconds for game to load to start screen
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

    const handleKeyDown = async (event: KeyboardEvent) => {
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
          await fetch(pushUrl, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ type: 'button', control, state: 'down' })
          }).catch(err => console.error('[Keyboard] Failed to send to Pusher:', err))
        }
      }
    }

    const handleKeyUp = async (event: KeyboardEvent) => {
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
          await fetch(pushUrl, {
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


  useEffect(() => {
    if (!mounted || interfaceStage !== 'landing') return

    const handleLandingKeys = (event: KeyboardEvent) => {
      const { code } = event
      if (code === 'ArrowLeft' || code === 'ArrowUp') {
        event.preventDefault()
        setLandingSelection('keyboard')
        return
      }
      if (code === 'ArrowRight' || code === 'ArrowDown') {
        event.preventDefault()
        setLandingSelection('phone')
        return
      }
      if (code === 'Enter' || code === 'Space' || code === 'KeyZ' || code === 'KeyO' || code === 'KeyB') {
        event.preventDefault()
        handleInputSelection(landingSelection)
      }
    }

    document.addEventListener('keydown', handleLandingKeys)
    return () => document.removeEventListener('keydown', handleLandingKeys)
  }, [mounted, interfaceStage, landingSelection])

  const callEmulatorMethod = useCallback(async (candidates: EmulatorMethodCandidate[]) => {
    if (typeof window === 'undefined') {
      return { ok: false as const, reason: 'no-window' as const }
    }
    const emulator = (window as any).EJS_emulator
    if (!emulator) {
      return { ok: false as const, reason: 'not-ready' as const }
    }

    for (const candidate of candidates) {
      const fn = emulator?.[candidate.name]
      if (typeof fn === 'function') {
        try {
          const result = fn.apply(emulator, candidate.args ?? [])
          if (result instanceof Promise) {
            await result
          }
          return { ok: true as const, method: candidate.name }
        } catch (error) {
          console.error(`[Emulator] ${candidate.name} failed`, error)
          return { ok: false as const, reason: 'error' as const, error }
        }
      }
    }

    return { ok: false as const, reason: 'unavailable' as const }
  }, [])

  const handleGlobalAction = useCallback(async (action: GlobalAction) => {
    if (action === 'back') {
      setGlobalMenuOpen(false)
      setGlobalMenuStatus(null)
      setActiveRomLocal(null)
      setActiveRomRemote(null)
      setInterfaceStage('gameSelection')
      setStatus('Returned to the game library.')
      return
    }

    const isSave = action === 'save'
    setGlobalActionBusy(true)
    setGlobalMenuStatus(isSave ? 'Saving game…' : 'Loading game…')
    const result = await callEmulatorMethod(isSave ? SAVE_METHOD_CANDIDATES : LOAD_METHOD_CANDIDATES)
    setGlobalActionBusy(false)

    if (result.ok) {
      const message = isSave ? 'Game saved to this browser.' : 'Loaded the most recent save.'
      setStatus(message)
      setGlobalMenuStatus(message)
      setGlobalMenuOpen(false)
      return
    }

    let errorMessage = isSave ? 'Unable to save game.' : 'Unable to load game.'
    if (result.reason === 'no-window') {
      errorMessage = 'Saves are only available in the browser.'
    } else if (result.reason === 'not-ready') {
      errorMessage = 'Emulator has not finished loading yet.'
    } else if (result.reason === 'unavailable') {
      errorMessage = 'This emulator build does not expose save/load controls.'
    } else if (result.reason === 'error') {
      errorMessage = 'Save system reported an internal error. Check console logs.'
    }
    setStatus(errorMessage)
    setGlobalMenuStatus(errorMessage)
  }, [callEmulatorMethod])

  useEffect(() => {
    if (!globalMenuOpen) return

    const navCodes = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'])
    const confirmCodes = new Set(['Enter', 'Space', 'KeyZ', 'KeyO', 'KeyB'])
    const cancelCodes = new Set(['Escape', 'Backspace'])

    const handleKeyDown = (event: KeyboardEvent) => {
      const { code } = event
      if (!(navCodes.has(code) || confirmCodes.has(code) || cancelCodes.has(code))) return
      event.preventDefault()
      event.stopImmediatePropagation()

      if (navCodes.has(code)) {
        setGlobalMenuIndex((index) => {
          const last = globalMenuOptions.length - 1
          if (code === 'ArrowUp' || code === 'ArrowLeft') {
            return index === 0 ? last : index - 1
          }
          return index === last ? 0 : index + 1
        })
        return
      }

      if (cancelCodes.has(code)) {
        setGlobalMenuOpen(false)
        setGlobalMenuStatus(null)
        return
      }

      if (confirmCodes.has(code)) {
        const option = globalMenuOptions[globalMenuIndex]
        if (option) {
          handleGlobalAction(option.id)
        }
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      const { code } = event
      if (navCodes.has(code) || confirmCodes.has(code) || cancelCodes.has(code)) {
        event.preventDefault()
        event.stopImmediatePropagation()
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)
    document.addEventListener('keyup', handleKeyUp, true)
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
      document.removeEventListener('keyup', handleKeyUp, true)
    }
  }, [globalMenuOpen, globalMenuIndex, globalMenuOptions, handleGlobalAction])

  useEffect(() => {
    if (!globalMenuOpen) return
    setGlobalMenuIndex(0)
    setGlobalMenuStatus(null)
  }, [globalMenuOpen])


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
      setHasControllerConnected(true)
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

  // Controller navigation for game selection
  useEffect(() => {
    if (!mounted || isNavigatingGames) return

    const handleGameNavigation = (event: KeyboardEvent) => {
      // Only handle navigation when no game is active
      if (activeRomLocal || activeRomRemote) return
      
      const currentList = selectedGameType === 'local' ? filteredLocal : filteredRemote
      if (currentList.length === 0) return

      let newIndex = selectedGameIndex
      let newType = selectedGameType

      switch (event.code) {
        case 'ArrowUp':
          event.preventDefault()
          if (selectedGameType === 'remote' && selectedGameIndex === 0 && filteredLocal.length > 0) {
            // Switch to local list, go to last item
            newType = 'local'
            newIndex = Math.max(0, filteredLocal.length - 1)
          } else if (selectedGameIndex > 0) {
            newIndex = selectedGameIndex - 1
          }
          break
        case 'ArrowDown':
          event.preventDefault()
          if (selectedGameType === 'local' && selectedGameIndex === filteredLocal.length - 1 && filteredRemote.length > 0) {
            // Switch to remote list, go to first item
            newType = 'remote'
            newIndex = 0
          } else if (selectedGameIndex < currentList.length - 1) {
            newIndex = selectedGameIndex + 1
          }
          break
        case 'Enter':
          event.preventDefault()
          if (currentList.length > 0) {
            const selectedGame = currentList[selectedGameIndex]
            if (selectedGameType === 'local') {
              setActiveRomLocal((selectedGame as StoredRomMeta).name)
              setActiveRomRemote(null)
            } else {
              setActiveRomLocal(null)
              setActiveRomRemote(selectedGame as RemoteRom)
            }
          }
          break
        case 'Escape':
          event.preventDefault()
          setIsNavigatingGames(false)
          break
        default:
          return
      }

      if (newIndex !== selectedGameIndex || newType !== selectedGameType) {
        setSelectedGameIndex(newIndex)
        setSelectedGameType(newType)
        setIsNavigatingGames(true)
      }
    }

    document.addEventListener('keydown', handleGameNavigation)
    return () => document.removeEventListener('keydown', handleGameNavigation)
  }, [mounted, selectedGameIndex, selectedGameType, filteredLocal, filteredRemote, activeRomLocal, activeRomRemote, isNavigatingGames])

  // Reset navigation when games change
  useEffect(() => {
    setSelectedGameIndex(0)
    setSelectedGameType('local')
  }, [filteredLocal, filteredRemote])

  // Transition to game selection when controller connects
  useEffect(() => {
    if (hasControllerConnected && interfaceStage === 'qr') {
      setInterfaceStage('gameSelection')
    }
  }, [hasControllerConnected, interfaceStage])

  // Transition to emulator when game is selected
  useEffect(() => {
    if ((activeRomLocal || activeRomRemote) && interfaceStage === 'gameSelection') {
      setInterfaceStage('emulator')
    }
  }, [activeRomLocal, activeRomRemote, interfaceStage])

  const handleInputSelection = (method: 'keyboard' | 'phone') => {

    setLandingSelection(method)
    setSelectedInputMethod(method)
    if (method === 'keyboard') {
      setInterfaceStage('gameSelection')
    } else {
      setInterfaceStage('qr')
    }
  }

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

  if (interfaceStage === 'landing') {
    return (
      <div className="py-10 flex flex-col items-center gap-12 text-center">
        <div className="space-y-4 max-w-3xl">
          <h1 className="text-4xl font-bold">Play SNES together</h1>
          <p className="text-lg text-white/70">
            Choose how you want to control the game. You can play right here with a keyboard or connect
            up to two phones as wireless controllers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
          <button
            className={`rounded-2xl border-2 p-8 transition-all ${
              landingSelection === 'keyboard'

                ? 'border-primary bg-primary/20 scale-[1.01]'
                : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
            }`}
            onClick={() => handleInputSelection('keyboard')}
          >
            <div className="space-y-3">
              <div className="text-sm uppercase tracking-wide text-white/60">Option 1</div>
              <div className="text-2xl font-semibold">Use this keyboard</div>
              <p className="text-sm text-white/70">
                Start playing immediately. Keyboard controls support two players (WASD + Arrow keys) and work without a phone.
              </p>
              <div className="text-xs text-white/50">Best for quick local play</div>
            </div>
          </button>

          <button
            className={`rounded-2xl border-2 p-8 transition-all ${

              landingSelection === 'phone'

                ? 'border-primary bg-primary/20 scale-[1.01]'
                : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
            }`}
            onClick={() => handleInputSelection('phone')}
          >
            <div className="space-y-3">
              <div className="text-sm uppercase tracking-wide text-white/60">Option 2</div>
              <div className="text-2xl font-semibold">Connect phones</div>
              <p className="text-sm text-white/70">
                Generate QR codes for players to scan. Each phone becomes a dedicated SNES controller with haptics.
              </p>
              <div className="text-xs text-white/50">Perfect for couch co-op</div>
            </div>
          </button>
        </div>

        <div className="text-sm text-white/50 space-y-1">
          <div>Session code: {sessionId ?? 'Generating…'}</div>
          <div>Pusher status: {usePusher ? pusherStatus : 'disabled'}</div>
        </div>
      </div>
    )
  }

  // QR Code Stage - Show QR codes for controller connection
  if (interfaceStage === 'qr') {
    return (
      <div className="py-6 flex flex-col items-center justify-center min-h-[80vh] space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">SNES Emulator</h1>
          <p className="text-xl text-white/70">Connect your mobile controller to start</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl">
          <div className="text-center space-y-4">
            <div className="text-lg font-medium">Player 1</div>
            {qr1 ? (
              <img src={qr1} alt="Player 1 QR" className="mx-auto border-4 border-white/20 rounded-lg" />
            ) : (
              <div className="w-48 h-48 bg-white/10 rounded-lg flex items-center justify-center">
                <div className="text-white/50">Loading QR...</div>
              </div>
            )}
            <div className="text-sm text-white/60">Scan with your phone</div>
          </div>
          
          <div className="text-center space-y-4">
            <div className="text-lg font-medium">Player 2</div>
            {qr2 ? (
              <img src={qr2} alt="Player 2 QR" className="mx-auto border-4 border-white/20 rounded-lg" />
            ) : (
              <div className="w-48 h-48 bg-white/10 rounded-lg flex items-center justify-center">
                <div className="text-white/50">Loading QR...</div>
              </div>
            )}
            <div className="text-sm text-white/60">Scan with your phone</div>
          </div>
        </div>
        
        <div className="text-center space-y-2">
          <div className="text-sm text-white/60">
            Controllers connected: {controllerCount}
          </div>
          {controllerCount > 0 && (
            <div className="text-green-400 font-medium">
              Controller detected! Transitioning to game selection...
            </div>
          )}
          <button
            onClick={() => { setInterfaceStage('landing'); setSelectedInputMethod(null) }}
            className="mt-4 text-xs text-white/60 hover:text-white"
          >
            ← Choose a different control method
          </button>
        </div>
      </div>
    )
  }

  // Game Selection Stage - Show game tiles with controller navigation
  if (interfaceStage === 'gameSelection') {
    return (
      <div className="py-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Select a Game</h1>
          <p className="text-white/70">
            {selectedInputMethod === 'keyboard'
              ? 'Use the keyboard (WASD / Arrow keys) to navigate and press Enter to start.'
              : 'Use the connected phone controller or arrow keys to navigate, Enter to select.'}
          </p>
          <button
            onClick={() => { setInterfaceStage('landing'); setSelectedInputMethod(null) }}
            className="text-xs text-white/60 hover:text-white"
          >
            ← Choose a different control method
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {/* Local Games */}
          {filteredLocal.map((game, index) => {
            const isSelected = selectedGameType === 'local' && selectedGameIndex === index
            const screenshot = gameScreenshots[game.name]
            return (
              <div
                key={game.name}
                className={`relative rounded-lg border-2 transition-all cursor-pointer ${
                  isSelected 
                    ? 'border-primary bg-primary/20 scale-105' 
                    : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                }`}
                onClick={() => {
                  setActiveRomLocal(game.name)
                  setActiveRomRemote(null)
                }}
              >
                <div className="aspect-video bg-black rounded-t-lg overflow-hidden">
                  {screenshot ? (
                    <img 
                      src={screenshot} 
                      alt={`${prettifyName(game.name)} preview`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl text-white/30">
                      {prettifyName(game.name).charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <div className="font-medium truncate">{prettifyName(game.name)}</div>
                  <div className="text-xs text-white/50">{formatSize(game.size)}</div>
                </div>
                {isSelected && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
            )
          })}
          
          {/* Remote Games */}
          {filteredRemote.map((game, index) => {
            const isSelected = selectedGameType === 'remote' && selectedGameIndex === index
            const screenshot = gameScreenshots[game.name]
            return (
              <div
                key={game.url}
                className={`relative rounded-lg border-2 transition-all cursor-pointer ${
                  isSelected 
                    ? 'border-primary bg-primary/20 scale-105' 
                    : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                }`}
                onClick={() => {
                  setActiveRomLocal(null)
                  setActiveRomRemote(game)
                }}
              >
                <div className="aspect-video bg-black rounded-t-lg overflow-hidden">
                  {screenshot ? (
                    <img 
                      src={screenshot} 
                      alt={`${prettifyName(game.name)} preview`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl text-white/30">
                      {prettifyName(game.name).charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <div className="font-medium truncate">{prettifyName(game.name)}</div>
                  <div className="text-xs text-white/50">Remote</div>
                </div>
                {isSelected && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        
        <div className="text-center text-sm text-white/60">
          Controllers connected: {controllerCount} • Use arrow keys to navigate, Enter to select
        </div>
      </div>
    )
  }

  // Emulator Stage - Full emulator interface
  return (
    <div className="relative">
      {globalMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-md space-y-5 rounded-2xl border border-white/10 bg-black/85 p-6 shadow-xl">
            <button
              onClick={() => { setGlobalMenuOpen(false); setGlobalMenuStatus(null) }}
              className="absolute right-4 top-4 text-xs text-white/60 hover:text-white"
            >
              Close
            </button>
            <div className="space-y-1 text-center">
              <h2 className="text-xl font-semibold">Controller menu</h2>
              <p className="text-sm text-white/70">
                Use arrow keys (or the phone D-pad) to highlight an option, then press B/Enter to confirm.
              </p>
            </div>
            <div className="space-y-2">
              {globalMenuOptions.map((option, index) => {
                const isSelected = index === globalMenuIndex
                return (
                  <button
                    key={option.id}
                    onClick={() => handleGlobalAction(option.id)}
                    disabled={globalActionBusy}
                    className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                      isSelected
                        ? 'border-primary bg-primary/20 text-white'
                        : 'border-white/15 bg-white/5 text-white/80 hover:border-white/40 hover:bg-white/10'
                    } ${globalActionBusy ? 'opacity-60 cursor-wait' : ''}`}
                  >
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-white/60">{option.description}</div>
                    {isSelected && <div className="mt-1 text-[10px] uppercase text-primary/80">Selected</div>}
                  </button>
                )
              })}
            </div>
            {globalMenuStatus && (
              <div className="text-center text-xs text-white/70">{globalMenuStatus}</div>
            )}
            <div className="text-center text-[11px] text-white/40">Press Menu/Select again to close this panel.</div>
          </div>
        </div>
      )}

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
              {filteredLocal.map((r, index) => {
                const isSelected = selectedGameType === 'local' && selectedGameIndex === index
                const screenshot = gameScreenshots[r.name]
                return (
                  <li key={r.name} className={`p-3 flex items-center justify-between gap-3 transition-colors ${isSelected ? 'bg-primary/20 border-l-2 border-primary' : 'hover:bg-white/5'}`}>
                    <button
                      className="text-left flex-1 hover:text-primary flex items-center gap-3"
                      onClick={() => { setActiveRomRemote(null); setActiveRomLocal(r.name) }}
                      title="Load in emulator"
                    >
                      {/* Game preview thumbnail */}
                      <div className="w-12 h-8 bg-black/50 rounded border border-white/10 flex-shrink-0 overflow-hidden">
                        {screenshot ? (
                          <img
                            src={screenshot}
                            alt={`${prettifyName(r.name)} preview`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-white/30">
                            {prettifyName(r.name).charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{prettifyName(r.name)}</div>
                        <div className="text-xs text-white/50">{formatSize(r.size)} · {new Date(r.addedAt).toLocaleString()}</div>
                      </div>
                    </button>
                    <button className="text-xs text-white/60 hover:text-red-400" title="Delete from library" onClick={async () => { await deleteRom(r.name); setRoms(await listRoms()); if (activeRomLocal === r.name) setActiveRomLocal(null) }}>remove</button>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Remote Library */}
          {!!remoteError && <p className="text-xs text-red-400">{remoteError}</p>}
          {remoteRoms && remoteRoms.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-lg font-medium">Remote Library</h2>
              <p className="text-xs text-white/60">Files served from <code>/public/roms</code> or <code>/public/snes</code>.</p>
              <ul className="max-h-[30vh] overflow-auto divide-y divide-white/10 rounded border border-white/10">
                {filteredRemote.map((r, index) => {
                  const isSelected = selectedGameType === 'remote' && selectedGameIndex === index
                  const screenshot = gameScreenshots[r.name]
                  return (
                    <li key={r.url} className={`p-3 flex items-center justify-between gap-3 transition-colors ${isSelected ? 'bg-primary/20 border-l-2 border-primary' : 'hover:bg-white/5'}`}>
                      <button
                        className="text-left flex-1 hover:text-primary flex items-center gap-3"
                        onClick={() => { setActiveRomLocal(null); setActiveRomRemote(r) }}
                        title="Stream in emulator"
                      >
                        {/* Game preview thumbnail */}
                        <div className="w-12 h-8 bg-black/50 rounded border border-white/10 flex-shrink-0 overflow-hidden">
                          {screenshot ? (
                            <img
                              src={screenshot}
                              alt={`${prettifyName(r.name)} preview`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-white/30">
                              {prettifyName(r.name).charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{prettifyName(r.name)}</div>
                          <div className="text-xs text-white/50 truncate">{r.url}</div>
                        </div>
                      </button>
                    </li>
                  )
                })}
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
            <button
              onClick={() =>
                setGlobalMenuOpen(prev => {
                  const next = !prev
                  if (next) {
                    setGlobalMenuIndex(0)
                    setGlobalMenuStatus(null)
                  }
                  return next
                })
              }
              className="absolute left-3 bottom-3 px-2.5 py-1.5 text-xs rounded bg-white/10 hover:bg-white/20 text-white"
            >
              Menu
            </button>
          </div>
          {status && <div className="text-sm text-white/70">{status}</div>}
          <div className="text-xs text-white/50">
            Pusher: {pusherStatus}
            {!usePusher && <span className="text-red-400"> (env vars missing)</span>}
            {usePusher && pusherStatus === 'idle' && <span className="text-yellow-400"> (connecting...)</span>}
            · Controllers: {controllerCount}
          </div>
          {!activeRomLocal && !activeRomRemote && (
            <div className="text-sm text-white/60">
              {isNavigatingGames ? (
                <div className="space-y-2">
                  <div>🎮 Controller Navigation Active</div>
                  <div className="text-xs text-white/50">
                    Use ↑↓ arrows to navigate, Enter to select, Escape to exit
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div>Select a ROM from the left to start playing.</div>
                  <div className="text-xs text-white/50">
                    Use arrow keys to navigate with controller, or click to select
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Keyboard Controls Display */}
          <div className="space-y-3">
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

            {/* Game Navigation Controls */}
            <div className="text-xs text-white/60">
              <div className="font-medium text-white/80 mb-1">Game Selection</div>
              <div className="grid grid-cols-2 gap-1 text-[10px]">
                <div>↑↓ - Navigate games</div>
                <div>Enter - Select game</div>
                <div>Escape - Exit navigation</div>
                <div>Click - Select game</div>
              </div>
            </div>

            {/* Screenshot Controls */}
            {activeRomLocal && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => captureGameScreenshot(activeRomLocal)}
                  className="px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20 text-white"
                  title="Capture screenshot of current game"
                >
                  📸 Capture Screenshot
                </button>
              </div>
            )}
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
    </div>
  )
}
