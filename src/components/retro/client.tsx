"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { Gamepad2, Keyboard, Monitor, Smartphone, Upload, Users, Wifi } from "lucide-react"
import Pusher from 'pusher-js'
import { deleteRom, getRom, listRoms, putRom, type StoredRomMeta } from "@/lib/idb-roms"
import {
  downloadSave,
  gameKeyFor,
  generateSaveCode,
  MAX_SAVE_BYTES,
  normalizeSaveCode,
  saveFingerprint,
  uploadSave,
} from "@/lib/retro/saves"
import {
  ANALOG_MAX,
  getRetroSystem,
  isAnalogAxis,
  isRomFileName,
  pusherChannelFor,
  RETRO_SYSTEMS,
  romAcceptAttribute,
  STICK_INDEX,
  stripRomExtension,
  type RetroSystem,
  type RetroSystemId,
} from "@/lib/retro/systems"
import { useGamepads } from "./use-gamepads"
import { installAudioUnlock, isEmulatorAudioBlocked } from "./audio-unlock"

type RemoteRom = { name: string; url: string }

type GameEntry =
  | { kind: 'local'; key: string; name: string; size: number }
  | { kind: 'remote'; key: string; name: string; rom: RemoteRom }

type NavAction = 'up' | 'down' | 'left' | 'right' | 'confirm' | 'back'

type GlobalAction = 'back' | 'save' | 'load'

// Pinned: the "latest" channel's 4.3 pre-release frontend calls a save-state export the published cores lack
const EJS_DATA_PATH = 'https://cdn.emulatorjs.org/4.2.3/data/'

// Shared by every console so one save code syncs all of them
const SAVE_CODE_STORAGE_KEY = 'snes-save-code'

const SRAM_SYNC_INTERVAL_MS = 20_000

const MIN_PRESS_MS = 70
const MIN_RELEASE_GAP_MS = 34

// How far the phone's analog stick must lean before it moves a menu selection
const STICK_NAV_THRESHOLD = 0.6
const CONTROLLER_ACTIVE_WINDOW_MS = 25_000

// Menu navigation: d-pad/arrows/WASD move, A (X / I) confirms, B (Z / O) goes back
const NAV_KEYS: Record<string, NavAction> = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  KeyX: 'confirm',
  KeyI: 'confirm',
  Enter: 'confirm',
  Space: 'confirm',
  KeyZ: 'back',
  KeyO: 'back',
  Escape: 'back',
  Backspace: 'back',
}

const NAV_CONTROLS: Record<string, NavAction> = {
  up: 'up',
  down: 'down',
  left: 'left',
  right: 'right',
  a: 'confirm',
  cross: 'confirm',
  start: 'confirm',
  b: 'back',
  circle: 'back',
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  const units = ["KB", "MB", "GB"]
  let i = -1
  do { bytes = bytes / 1024; i++ } while (bytes >= 1024 && i < units.length - 1)
  return `${bytes.toFixed(1)} ${units[i]}`
}

const prettifyName = (system: RetroSystem, name: string) =>
  stripRomExtension(system, name)
    // remove trailing (1), (2) etc
    .replace(/\s*\((\d+)\)\s*$/i, '')
    // remove region/extra tags like (USA), [!], [v1.0], etc
    .replace(/\s*[\[(].*?[\])]\s*/g, ' ')
    .replace(/[._]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()

const searchKey = (system: RetroSystem, name: string) =>
  prettifyName(system, name)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')

function isEditableTarget(target: EventTarget | null): target is HTMLElement {
  if (!(target instanceof HTMLElement)) return false
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
}

function enterFullscreen() {
  if (typeof document === 'undefined' || document.fullscreenElement) return
  const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void }
  try {
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {})
    else el.webkitRequestFullscreen?.()
  } catch {}
}

function exitFullscreen() {
  if (typeof document === 'undefined' || !document.fullscreenElement) return
  document.exitFullscreen().catch(() => {})
}

function stopEmulator() {
  const w = window as any
  try { w.EJS_emulator?.pause?.() } catch {}
  w.EJS_emulator = undefined
}

function getGameManager(): any | null {
  const emulator = (window as any).EJS_emulator
  return emulator?.started && emulator.gameManager ? emulator.gameManager : null
}

// Mirrors EmulatorJS's own "Import Save File" button
function writeSramToEmulator(gameManager: any, data: Uint8Array) {
  const FS = gameManager.FS
  const path: string = gameManager.getSaveFilePath()
  let dir = ''
  for (const part of path.split('/').slice(0, -1)) {
    if (!part) continue
    dir += `/${part}`
    if (!FS.analyzePath(dir).exists) FS.mkdir(dir)
  }
  if (FS.analyzePath(path).exists) FS.unlink(path)
  FS.writeFile(path, data)
  gameManager.loadSaveFiles()
}

function timeLabel() {
  return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

// loader.js declares top-level consts, so it can only be re-run as a fresh module instance
function runEmulatorLoader() {
  return new Promise<void>((resolve, reject) => {
    document.querySelectorAll('script[data-ejs-loader]').forEach((s) => s.remove())
    const s = document.createElement('script')
    s.type = 'module'
    s.src = `${EJS_DATA_PATH}loader.js?run=${Date.now()}`
    s.dataset.ejsLoader = 'true'
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Failed to load EmulatorJS loader'))
    document.body.appendChild(s)
  })
}

export default function RetroClient(props: { system: RetroSystemId; sessionId?: string }) {
  const system = getRetroSystem(props.system)
  const [roms, setRoms] = useState<StoredRomMeta[]>([])
  const [loading, setLoading] = useState(false)
  const [activeRomLocal, setActiveRomLocal] = useState<string | null>(null)
  const [activeRomRemote, setActiveRomRemote] = useState<RemoteRom | null>(null)
  const [status, setStatus] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [mounted, setMounted] = useState(false)
  const [search, setSearch] = useState("")
  const [romUploadError, setRomUploadError] = useState<string | null>(null)
  const [remoteRoms, setRemoteRoms] = useState<RemoteRom[] | null>(null)
  const [remoteError, setRemoteError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [audioBlocked, setAudioBlocked] = useState(false)

  const [sessionId, setSessionId] = useState<string | null>(props.sessionId || null)
  const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY
  const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER
  const usePusher = !!pusherKey && !!pusherCluster
  const [pusherStatus, setPusherStatus] = useState<'idle' | 'subscribing' | 'subscribed' | 'error'>('idle')
  const [playerActivity, setPlayerActivity] = useState<Record<string, number>>({})
  const [desiredPlayers, setDesiredPlayers] = useState<1 | 2>(1)

  // Game selection state for controller navigation
  const [selectedIndex, setSelectedIndex] = useState<number>(0)
  const [gameScreenshots, setGameScreenshots] = useState<Record<string, string>>({})
  const gridRef = useRef<HTMLDivElement | null>(null)

  // Multi-stage interface state
  const [interfaceStage, setInterfaceStage] = useState<'landing' | 'qr' | 'gameSelection' | 'emulator'>('landing')

  const [globalMenuOpen, setGlobalMenuOpen] = useState(false)
  const [globalMenuIndex, setGlobalMenuIndex] = useState(0)
  const [globalMenuStatus, setGlobalMenuStatus] = useState<string | null>(null)
  const [globalActionBusy, setGlobalActionBusy] = useState(false)

  // Cloud saves: a save code links browsers; without one, saves stay in this browser only
  const [saveCode, setSaveCode] = useState<string | null>(null)
  const [saveCodeInput, setSaveCodeInput] = useState('')
  const [saveCodeError, setSaveCodeError] = useState<string | null>(null)
  const [cloudStatus, setCloudStatus] = useState<string | null>(null)
  const saveCodeRef = useRef<string | null>(null)
  const currentGameKeyRef = useRef<string | null>(null)
  const lastSramFingerprintRef = useRef<string | null>(null)
  // Uploads wait until the cloud copy has been restored, so a stale local save can't overwrite it
  const sramReadyRef = useRef(false)

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
        description: saveCode
          ? 'Snapshot progress to the cloud under your save code.'
          : 'Snapshot progress to this browser. Set a save code to sync across browsers.'
      },
      {
        id: 'load' as GlobalAction,
        label: 'Load last save',
        description: saveCode
          ? 'Restore the snapshot stored under your save code.'
          : 'Restore the last snapshot saved in this browser.'
      }
    ],
    [saveCode]
  )

  const pressStartedAtRef = useRef(new Map<string, number>())
  const pendingReleaseRef = useRef(new Map<string, number>())

  // EmulatorJS matches keyboard input on keyCode, which synthetic KeyboardEvents can't set,
  // so phone presses go straight to the emulator's input API instead
  function emit(control: string, state: 'down' | 'up') {
    const match = /^(?:p([12])_)?([a-z0-9]+)$/.exec(control)
    const button = match ? system.buttonIndex[match[2]] : undefined
    if (!match || button === undefined) {
      console.warn('[Controller] Unknown control:', control)
      return
    }
    const gameManager = getGameManager()
    if (!gameManager) return
    const player = match[1] === '2' && system.maxPlayers > 1 ? 1 : 0
    const key = `${player}:${button}`
    const pressValue = isAnalogAxis(button) ? ANALOG_MAX : 1

    // A tap's press and release can arrive within one frame over the network; the game only
    // samples input once per frame, so every press is held for a few frames before releasing
    const pending = pendingReleaseRef.current.get(key)
    if (pending !== undefined) {
      window.clearTimeout(pending)
      pendingReleaseRef.current.delete(key)
      if (state === 'down') {
        gameManager.simulateInput(player, button, 0)
        window.setTimeout(() => {
          pressStartedAtRef.current.set(key, performance.now())
          getGameManager()?.simulateInput(player, button, pressValue)
        }, MIN_RELEASE_GAP_MS)
        return
      }
    }

    if (state === 'down') {
      pressStartedAtRef.current.set(key, performance.now())
      gameManager.simulateInput(player, button, pressValue)
      return
    }

    const wait = MIN_PRESS_MS - (performance.now() - (pressStartedAtRef.current.get(key) ?? 0))
    if (wait <= 0) {
      gameManager.simulateInput(player, button, 0)
      return
    }
    pendingReleaseRef.current.set(key, window.setTimeout(() => {
      pendingReleaseRef.current.delete(key)
      getGameManager()?.simulateInput(player, button, 0)
    }, wait))
  }

  // Each stick axis is two one-sided analog inputs, so the opposite side is zeroed on every update
  function emitAnalog(playerId: string | undefined, x: number, y: number) {
    const gameManager = getGameManager()
    if (!gameManager) return
    const player = playerId === '2' ? 1 : 0
    const magnitude = (v: number) => Math.round(Math.min(1, Math.abs(v)) * ANALOG_MAX)
    gameManager.simulateInput(player, x > 0 ? STICK_INDEX.right : STICK_INDEX.left, magnitude(x))
    gameManager.simulateInput(player, x > 0 ? STICK_INDEX.left : STICK_INDEX.right, 0)
    gameManager.simulateInput(player, y > 0 ? STICK_INDEX.down : STICK_INDEX.up, magnitude(y))
    gameManager.simulateInput(player, y > 0 ? STICK_INDEX.up : STICK_INDEX.down, 0)
  }

  const captureGameScreenshot = async (gameName: string) => {
    try {
      const canvas = document.querySelector('#ejs-container canvas') as HTMLCanvasElement | null
      if (!canvas) return

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/png', 0.8)
      })

      if (blob) {
        const url = URL.createObjectURL(blob)
        setGameScreenshots(prev => ({ ...prev, [gameName]: url }))
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
    return `${origin}/games/${system.id}/${encodeURIComponent(sessionId)}/player/`
  }, [sessionId, system.id])
  const qr1 = useMemo(() => controllerBase ? `/api/qr?size=180&text=${encodeURIComponent(controllerBase + '1')}` : '', [controllerBase])
  const qr2 = useMemo(() => controllerBase ? `/api/qr?size=180&text=${encodeURIComponent(controllerBase + '2')}` : '', [controllerBase])

  useEffect(() => {
    setMounted(true)
    ;(async () => setRoms(await listRoms(system.romDb)))()
    try {
      const stored = normalizeSaveCode(localStorage.getItem(SAVE_CODE_STORAGE_KEY) ?? '')
      if (stored) setSaveCode(stored)
    } catch {}
  }, [system.romDb])

  useEffect(() => {
    saveCodeRef.current = saveCode
  }, [saveCode])

  const applySaveCode = (input: string) => {
    const code = normalizeSaveCode(input)
    if (!code) {
      setSaveCodeError('Use 4-64 letters, numbers, dashes or underscores.')
      return
    }
    setSaveCodeError(null)
    setSaveCode(code)
    setSaveCodeInput('')
    try { localStorage.setItem(SAVE_CODE_STORAGE_KEY, code) } catch {}
  }

  const clearSaveCode = () => {
    setSaveCode(null)
    setCloudStatus(null)
    try { localStorage.removeItem(SAVE_CODE_STORAGE_KEY) } catch {}
  }

  // Reads the in-game save synchronously, so it is safe to call right before the emulator is stopped
  const pushSram = async (keepalive = false) => {
    const code = saveCodeRef.current
    const game = currentGameKeyRef.current
    if (!code || !game || !sramReadyRef.current) return
    const gameManager = getGameManager()
    if (!gameManager) return
    let data: Uint8Array | null = null
    try { data = gameManager.getSaveFile() } catch { return }
    if (!data || data.length === 0) return
    const fingerprint = saveFingerprint(data)
    if (fingerprint === lastSramFingerprintRef.current) return
    const ok = await uploadSave(code, game, 'sram', data, keepalive)
    if (ok) {
      lastSramFingerprintRef.current = fingerprint
      setCloudStatus(`Cloud save synced ${timeLabel()}`)
    } else {
      setCloudStatus('Cloud sync failed; will retry')
    }
  }

  const restoreCloudSram = async () => {
    const code = saveCodeRef.current
    const game = currentGameKeyRef.current
    if (!code || !game) return
    const gameManager = getGameManager()
    if (!gameManager) return
    try {
      const cloud = await downloadSave(code, game, 'sram')
      if (currentGameKeyRef.current !== game) return
      if (cloud && cloud.length > 0) {
        writeSramToEmulator(gameManager, cloud)
        lastSramFingerprintRef.current = saveFingerprint(cloud)
        setCloudStatus('Cloud save loaded')
      } else {
        setCloudStatus('No cloud save yet; progress will sync')
      }
      sramReadyRef.current = true
      // Seeds the cloud with an existing in-browser save the first time a code is used
      if (!cloud) await pushSram()
    } catch (error) {
      console.error('[Cloud saves] restore failed', error)
      setCloudStatus('Could not reach cloud saves')
    }
  }

  const restoreCloudSramRef = useRef(restoreCloudSram)
  const pushSramRef = useRef(pushSram)
  useEffect(() => {
    restoreCloudSramRef.current = restoreCloudSram
    pushSramRef.current = pushSram
  })

  // Periodically upload changed in-game saves, plus a final flush when the tab is hidden or closed
  useEffect(() => {
    if (interfaceStage !== 'emulator' || !saveCode) return
    const id = window.setInterval(() => { void pushSramRef.current() }, SRAM_SYNC_INTERVAL_MS)
    const flush = () => { void pushSramRef.current(true) }
    const onVisibility = () => { if (document.visibilityState === 'hidden') flush() }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', flush)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', flush)
    }
  }, [interfaceStage, saveCode])

  useEffect(() => {
    if (interfaceStage !== 'emulator' && globalMenuOpen) {
      setGlobalMenuOpen(false)
      setGlobalMenuStatus(null)
    }
  }, [interfaceStage, globalMenuOpen])

  // Fetch remote ROM manifest
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/roms?system=${system.id}`, { cache: 'no-store' })
        if (!res.ok) throw new Error(`${res.status}`)
        const data = await res.json()
        if (!cancelled) setRemoteRoms(Array.isArray(data) ? data : [])
      } catch (e: any) {
        if (!cancelled) setRemoteError(e?.message || 'Failed to load manifest')
      }
    })()
    return () => { cancelled = true }
  }, [system.id])

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
        const found = await getRom(system.romDb, activeRomLocal!)
        if (cancelled) return
        if (!found) { setStatus('ROM not found'); return }
        url = URL.createObjectURL(found.blob)
        gameName = activeRomLocal!
      } else {
        url = activeRomRemote!.url
        gameName = activeRomRemote!.name
      }
      const w = window as any
      w.EJS_player = '#ejs-container'
      w.EJS_core = system.core
      w.EJS_gameName = gameName
      w.EJS_pathtodata = EJS_DATA_PATH
      w.EJS_gameUrl = url
      w.EJS_mobileDevices = true
      w.EJS_startOnLoaded = true
      // Window globals outlive client-side navigation, so clear another console's bindings
      w.EJS_defaultControls = system.defaultControls

      currentGameKeyRef.current = gameKeyFor(system, gameName)
      lastSramFingerprintRef.current = null
      sramReadyRef.current = false
      setCloudStatus(null)
      w.EJS_onGameStart = () => {
        // Gamepads are read by useGamepads; EmulatorJS's own poller would double inputs and only binds player 1
        try { w.EJS_emulator?.gamepad?.terminate?.() } catch {}
        void restoreCloudSramRef.current()
      }

      try {
        setStatus('Starting emulator…')
        const container = document.getElementById('ejs-container')
        if (container) container.innerHTML = ''
        await runEmulatorLoader()
        if (cancelled) return

        setTimeout(() => {
          const canvas = document.querySelector('#ejs-container canvas') as HTMLCanvasElement | null
          const iframe = document.querySelector('#ejs-container iframe') as HTMLIFrameElement | null
          if (canvas) canvas.focus()
          else if (iframe) iframe.focus()
          setStatus('')

          // Capture a thumbnail once the game reaches its title screen
          setTimeout(() => {
            captureGameScreenshot(gameName)
          }, 3000)
        }, 1000)
      } catch (e: any) {
        console.error(e); setStatus(e?.message || 'Failed to start emulator')
      }
    })()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRomLocal, activeRomRemote, mounted])

  const saveState = async (): Promise<string> => {
    const gameManager = getGameManager()
    if (!gameManager) return 'Emulator has not finished loading yet.'
    const code = saveCodeRef.current
    const game = currentGameKeyRef.current
    try {
      gameManager.quickSave(1)
      if (!code || !game) return 'Game saved to this browser.'
      const state: Uint8Array = gameManager.getState()
      if (state.length > MAX_SAVE_BYTES) {
        return `Saved in this browser; this ${system.name} state is too large for cloud saves (${formatSize(state.length)}).`
      }
      const ok = await uploadSave(code, game, 'state', state)
      return ok ? 'Game saved to the cloud.' : 'Saved in this browser, but the cloud upload failed.'
    } catch (error) {
      console.error('[Emulator] save state failed', error)
      return 'Unable to save game.'
    }
  }

  const loadState = async (): Promise<string> => {
    const gameManager = getGameManager()
    if (!gameManager) return 'Emulator has not finished loading yet.'
    const code = saveCodeRef.current
    const game = currentGameKeyRef.current
    try {
      if (!code || !game) {
        gameManager.quickLoad(1)
        return 'Loaded the last save from this browser.'
      }
      const state = await downloadSave(code, game, 'state')
      if (!state) return 'No cloud save for this game yet.'
      gameManager.loadState(state)
      return 'Loaded your cloud save.'
    } catch (error) {
      console.error('[Emulator] load state failed', error)
      return 'Unable to load game.'
    }
  }

  const handleGlobalAction = async (action: GlobalAction) => {
    if (action === 'back') {
      void pushSram()
      stopEmulator()
      currentGameKeyRef.current = null
      exitFullscreen()
      setGlobalMenuOpen(false)
      setGlobalMenuStatus(null)
      setActiveRomLocal(null)
      setActiveRomRemote(null)
      setInterfaceStage('landing')
      setStatus('')
      return
    }

    const isSave = action === 'save'
    setGlobalActionBusy(true)
    setGlobalMenuStatus(isSave ? 'Saving game…' : 'Loading game…')
    const message = isSave ? await saveState() : await loadState()
    setGlobalActionBusy(false)
    setCloudStatus(message)
    setGlobalMenuStatus(message)
    if (message.startsWith('Game saved') || message.startsWith('Loaded')) {
      setGlobalMenuOpen(false)
    }
  }

  useEffect(() => {
    if (!globalMenuOpen) return
    setGlobalMenuIndex(0)
    setGlobalMenuStatus(null)
  }, [globalMenuOpen])

  useEffect(() => installAudioUnlock(), [])

  useEffect(() => {
    if (interfaceStage !== 'emulator') return
    const id = window.setInterval(() => setAudioBlocked(isEmulatorAudioBlocked()), 300)
    return () => {
      window.clearInterval(id)
      setAudioBlocked(false)
    }
  }, [interfaceStage])

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const toggleFullscreen = () => {
    if (document.fullscreenElement) exitFullscreen()
    else enterFullscreen()
  }

  async function handleFiles(files: FileList | null) {
    if (!files || !files.length) return
    const all = Array.from(files)
    const accepted = all.filter((f) => isRomFileName(system, f.name))
    const rejected = all.length - accepted.length
    setRomUploadError(rejected > 0
      ? `Skipped ${rejected} file${rejected === 1 ? '' : 's'}; ${system.name} ROMs must be ${system.romExtensions.map((e) => `.${e}`).join(', ')}.`
      : null)
    if (accepted.length === 0) return
    setLoading(true)
    try {
      for (const f of accepted) { await putRom(system.romDb, f) }
      setRoms(await listRoms(system.romDb))
    } catch (error) {
      console.error('[ROMs] failed to store', error)
      setRomUploadError('Could not store the ROM in this browser; it may be out of storage space.')
    } finally { setLoading(false) }
  }

  function onDrop(e: React.DragEvent) { e.preventDefault(); e.stopPropagation(); handleFiles(e.dataTransfer.files) }

  const games = useMemo<GameEntry[]>(() => {
    const searchLower = searchKey(system, search)
    const matches = (s: string) => searchLower.length === 0 || searchKey(system, s).includes(searchLower)
    const local: GameEntry[] = roms
      .filter(r => matches(r.name))
      .map(r => ({ kind: 'local', key: `local:${r.name}`, name: r.name, size: r.size }))
    const remote: GameEntry[] = (remoteRoms || [])
      .filter(r => matches(r.name) || matches(r.url))
      .map(r => ({ kind: 'remote', key: `remote:${r.url}`, name: r.name, rom: r }))
    return [...local, ...remote]
  }, [roms, remoteRoms, search, system])

  const safeSelectedIndex = Math.min(selectedIndex, Math.max(0, games.length - 1))
  const activePlayerIds = Object.keys(playerActivity)
  const controllerCount = activePlayerIds.length

  useEffect(() => {
    if (interfaceStage !== 'gameSelection' && interfaceStage !== 'landing') return
    const tile = gridRef.current?.querySelector(`[data-game-index="${safeSelectedIndex}"]`)
    tile?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [safeSelectedIndex, interfaceStage])

  const launchGame = (game: GameEntry, fromHostGesture: boolean) => {
    // Browsers only grant fullscreen inside a local click/keypress, so phone launches stay full-window only
    if (fromHostGesture) enterFullscreen()
    if (game.kind === 'local') {
      setActiveRomRemote(null)
      setActiveRomLocal(game.name)
    } else {
      setActiveRomLocal(null)
      setActiveRomRemote(game.rom)
    }
    setStatus('')
    setInterfaceStage('emulator')
  }

  const moveGameSelection = (action: 'up' | 'down' | 'left' | 'right') => {
    if (games.length === 0) return
    const last = games.length - 1
    const grid = gridRef.current
    const cols = grid
      ? Math.max(1, getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length)
      : 1
    const current = safeSelectedIndex
    let next = current
    if (action === 'left') next = Math.max(0, current - 1)
    else if (action === 'right') next = Math.min(last, current + 1)
    else if (action === 'up') next = current - cols >= 0 ? current - cols : current
    else if (action === 'down') {
      if (current + cols <= last) next = current + cols
      else if (Math.floor(last / cols) > Math.floor(current / cols)) next = last
    }
    setSelectedIndex(next)
  }

  const goToLanding = () => {
    setInterfaceStage('landing')
  }

  const navigate = (action: NavAction, fromHostGesture: boolean) => {
    if (globalMenuOpen) {
      const last = globalMenuOptions.length - 1
      if (action === 'up' || action === 'left') {
        setGlobalMenuIndex(i => (i === 0 ? last : i - 1))
      } else if (action === 'down' || action === 'right') {
        setGlobalMenuIndex(i => (i === last ? 0 : i + 1))
      } else if (action === 'confirm') {
        const option = globalMenuOptions[globalMenuIndex]
        if (option && !globalActionBusy) handleGlobalAction(option.id)
      } else if (action === 'back') {
        setGlobalMenuOpen(false)
        setGlobalMenuStatus(null)
      }
      return
    }

    if (interfaceStage === 'landing') {
      if (action === 'confirm') {
        const game = games[safeSelectedIndex]
        if (game) launchGame(game, fromHostGesture)
      } else if (action !== 'back') {
        moveGameSelection(action)
      }
      return
    }

    if (interfaceStage === 'qr') {
      if (action === 'back') goToLanding()
      return
    }

    if (interfaceStage === 'gameSelection') {
      if (action === 'confirm') {
        const game = games[safeSelectedIndex]
        if (game) launchGame(game, fromHostGesture)
      } else if (action === 'back') {
        goToLanding()
      } else {
        moveGameSelection(action)
      }
    }
  }

  const handleRemoteInput = (control: string, state: 'down' | 'up') => {
    if (control === '__hello') return
    if (control === '__menu') {
      if (state === 'down' && interfaceStage === 'emulator') setGlobalMenuOpen(prev => !prev)
      return
    }
    if (interfaceStage !== 'emulator' || globalMenuOpen) {
      if (state !== 'down') return
      const action = NAV_CONTROLS[control.replace(/^p[12]_/, '')]
      if (action) navigate(action, false)
      return
    }
    emit(control, state)
  }

  const stickNavRef = useRef(new Map<string, NavAction | null>())

  const handleRemoteAnalog = (playerId: string | undefined, x: number, y: number) => {
    if (interfaceStage === 'emulator' && !globalMenuOpen) {
      emitAnalog(playerId, x, y)
      return
    }
    // Releasing the stick must still reach the game, or it stays held after the menu closes
    if (x === 0 && y === 0) emitAnalog(playerId, 0, 0)
    // Menus move once per lean, like a d-pad tap
    const key = playerId ?? '1'
    let direction: NavAction | null = null
    if (Math.max(Math.abs(x), Math.abs(y)) >= STICK_NAV_THRESHOLD) {
      direction = Math.abs(x) > Math.abs(y) ? (x > 0 ? 'right' : 'left') : (y > 0 ? 'down' : 'up')
    }
    if (direction && direction !== stickNavRef.current.get(key)) navigate(direction, false)
    stickNavRef.current.set(key, direction)
  }

  const handleGamepadConnect = () => {
    // The lobby remains visible so players can see pairing and game selection together.
  }

  const navigateRef = useRef(navigate)
  const remoteInputRef = useRef(handleRemoteInput)
  const remoteAnalogRef = useRef(handleRemoteAnalog)
  const gamepadConnectRef = useRef(handleGamepadConnect)
  useEffect(() => {
    navigateRef.current = navigate
    remoteInputRef.current = handleRemoteInput
    remoteAnalogRef.current = handleRemoteAnalog
    gamepadConnectRef.current = handleGamepadConnect
  })

  const gamepads = useGamepads(system, {
    onButton: (player, control, state) => remoteInputRef.current(`p${player}_${control}`, state),
    onStick: (player, x, y) => remoteAnalogRef.current(String(player), x, y),
    onMenu: () => remoteInputRef.current('__menu', 'down'),
    onConnect: () => gamepadConnectRef.current(),
  })

  const navActive = interfaceStage !== 'emulator' || globalMenuOpen

  // Keyboard menu navigation (landing, QR, game picker, and the in-game controller menu)
  useEffect(() => {
    if (!mounted || !navActive) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (isEditableTarget(event.target)) {
        if (event.code === 'Escape') {
          event.preventDefault()
          event.target.blur()
        }
        return
      }
      const action = NAV_KEYS[event.code]
      if (!action) return
      event.preventDefault()
      if (globalMenuOpen) event.stopImmediatePropagation()
      if (event.repeat && (action === 'confirm' || action === 'back')) return
      navigateRef.current(action, true)
    }

    // Keep the emulator from seeing key releases while the menu owns the keyboard
    const handleKeyUp = (event: KeyboardEvent) => {
      if (globalMenuOpen && NAV_KEYS[event.code]) {
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
  }, [mounted, navActive, globalMenuOpen])

  // During gameplay: stop game keys from scrolling the page and lock page scroll behind the overlay
  useEffect(() => {
    if (interfaceStage !== 'emulator') return
    const prevHtml = document.documentElement.style.overflow
    const prevBody = document.body.style.overflow
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (system.gameKeys.includes(event.code) && !isEditableTarget(event.target)) event.preventDefault()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.documentElement.style.overflow = prevHtml
      document.body.style.overflow = prevBody
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [interfaceStage, system])

  // Pusher subscription only
  useEffect(() => {
    if (typeof window === 'undefined' || !sessionId) return
    if (!usePusher) return
    setPusherStatus('subscribing')
    const p = new Pusher(pusherKey!, { cluster: pusherCluster!, forceTLS: true, enableStats: true, wsHost: undefined })
    const channelName = pusherChannelFor(system.id, sessionId)
    const ch = p.subscribe(channelName)
    ch.bind('pusher:subscription_succeeded', () => setPusherStatus('subscribed'))
    ch.bind('pusher:error', (err: any) => { console.error('[pusher] error', err); setPusherStatus('error') })
    p.connection.bind('error', (err: any) => { console.error('[pusher] conn error', err) })
    ch.bind('input', (data: any) => {
      if (data?.type !== 'input') return
      if (data.input?.type === 'analog') {
        const { x, y } = data.input
        if (system.hasAnalogStick && Number.isFinite(x) && Number.isFinite(y)) {
          remoteAnalogRef.current(data.playerId, x, y)
        }
        return
      }
      if (data.input?.type !== 'button') return
      const { control, state } = data.input
      if ((state === 'down' || state === 'up') && typeof control === 'string') {
        remoteInputRef.current(control, state)
      }
    })
    ch.bind('pusher:subscription_error', (err: any) => { console.error('[pusher] sub error', err); setPusherStatus('error') })
    ch.bind('hello', (data: { playerId?: string }) => {
      if (data?.playerId !== '1' && data?.playerId !== '2') return
      setPlayerActivity((current) => ({ ...current, [data.playerId!]: Date.now() }))
    })
    return () => {
      try { ch.unbind_all(); p.unsubscribe(channelName); p.disconnect() } catch {}
      setPusherStatus('idle')
    }
  }, [sessionId, usePusher, pusherKey, pusherCluster, system])

  // A controller sends a heartbeat while its page is open. Expire stale phones so "active" stays truthful.
  useEffect(() => {
    const expireStalePlayers = () => {
      const cutoff = Date.now() - CONTROLLER_ACTIVE_WINDOW_MS
      setPlayerActivity((current) => {
        const active = Object.fromEntries(Object.entries(current).filter(([, lastSeen]) => lastSeen >= cutoff))
        return Object.keys(active).length === Object.keys(current).length ? current : active
      })
    }
    const id = window.setInterval(expireStalePlayers, 5_000)
    return () => window.clearInterval(id)
  }, [])

  if (!mounted) {
    return (
      <div className="py-10 text-center text-sm text-white/60">Loading…</div>
    )
  }

  if (interfaceStage === 'landing') {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-10">
        <header className="space-y-5 text-center">
          <div className="mx-auto inline-flex max-w-full overflow-x-auto rounded-full border border-white/10 bg-white/[0.04] p-1 text-sm">
            {Object.values(RETRO_SYSTEMS).map((s) => (
              s.id === system.id ? (
                <span key={s.id} className="whitespace-nowrap rounded-full bg-primary/25 px-4 py-2 font-medium text-white ring-1 ring-primary/40">{s.name}</span>
              ) : (
                <Link key={s.id} href={`/games/${s.id}`} className="whitespace-nowrap rounded-full px-4 py-2 text-white/50 transition hover:bg-white/5 hover:text-white">{s.name}</Link>
              )
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-primary">The browser is the console</p>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Pick a game. Pass the phones.</h1>
            <p className="mx-auto max-w-2xl text-base text-white/60 sm:text-lg">
              Play {system.name} on this screen. Phones become wireless controllers, or jump straight in with a keyboard or gamepad.
            </p>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.7fr)]">
          <aside className="space-y-5">
            <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
              <div className="border-b border-white/10 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/40">Game setup</p>
                    <h2 className="mt-1 text-xl font-semibold">Who&apos;s playing?</h2>
                  </div>
                  <Users className="size-5 text-primary" />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {([1, 2] as const).map((count) => {
                    const disabled = count > system.maxPlayers
                    return (
                      <button
                        key={count}
                        type="button"
                        disabled={disabled}
                        onClick={() => setDesiredPlayers(count)}
                        className={`rounded-xl border px-3 py-3 text-sm transition ${
                          desiredPlayers === count
                            ? 'border-primary bg-primary/20 text-white'
                            : 'border-white/10 bg-black/10 text-white/55 hover:border-white/25 hover:text-white'
                        } disabled:cursor-not-allowed disabled:opacity-30`}
                      >
                        {count} player{count === 1 ? '' : 's'}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-4 p-5">
                {Array.from({ length: desiredPlayers }, (_, index) => {
                  const playerId = String(index + 1)
                  const isActive = playerId in playerActivity
                  const qr = playerId === '1' ? qr1 : qr2
                  return (
                    <div key={playerId} className={`rounded-xl border p-4 transition ${isActive ? 'border-emerald-400/35 bg-emerald-400/[0.07]' : 'border-white/10 bg-black/10'}`}>
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 font-medium">
                          <Smartphone className="size-4 text-white/50" />
                          Player {playerId}
                        </div>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-medium ${isActive ? 'bg-emerald-400/15 text-emerald-300' : 'bg-white/5 text-white/40'}`}>
                          <span className={`size-1.5 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-white/25'}`} />
                          {isActive ? 'active' : 'waiting'}
                        </span>
                      </div>
                      {qr ? (
                        <img src={qr} alt={`Player ${playerId} controller QR code`} className="mx-auto aspect-square w-full max-w-40 rounded-lg bg-white p-2" />
                      ) : (
                        <div className="mx-auto aspect-square w-full max-w-40 animate-pulse rounded-lg bg-white/5" />
                      )}
                      <p className="mt-3 text-center text-xs text-white/45">
                        {isActive ? 'Controller is ready' : 'Scan with this player’s phone'}
                      </p>
                    </div>
                  )
                })}
              </div>
            </section>

            <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-medium"><Wifi className="size-4 text-primary" /> Session</span>
                <span className="text-xs text-white/40">{controllerCount}/{desiredPlayers} phones active</span>
              </div>
              <div className="flex items-start gap-3 rounded-xl bg-black/10 p-3 text-white/55">
                <Keyboard className="mt-0.5 size-4 shrink-0" />
                <span>{system.keyboardBlurb}</span>
              </div>
              <div className="flex items-start gap-3 rounded-xl bg-black/10 p-3 text-white/55">
                <Gamepad2 className="mt-0.5 size-4 shrink-0" />
                <span>{gamepads.length > 0 ? gamepads.map((pad) => `P${pad.player}: ${pad.name}`).join(' · ') : 'Bluetooth and USB gamepads work too—press any button to join.'}</span>
              </div>
              <div className="text-[11px] text-white/30">
                Connection: {usePusher ? pusherStatus : 'phone controllers unavailable'}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm">
              <div className="font-medium">Player save</div>
              {saveCode ? (
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-mono text-primary">{saveCode}</div>
                    <p className="mt-1 text-xs text-white/40">Progress syncs anywhere you use this code.</p>
                  </div>
                  <button type="button" onClick={clearSaveCode} className="shrink-0 text-xs text-white/40 hover:text-white">sign out</button>
                </div>
              ) : (
                <form className="mt-3 space-y-2" onSubmit={(event) => { event.preventDefault(); applySaveCode(saveCodeInput) }}>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={saveCodeInput}
                      onChange={(event) => { setSaveCodeInput(event.target.value); setSaveCodeError(null) }}
                      placeholder="Enter a save code"
                      className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/20 px-3 py-2 outline-none focus:border-primary/60"
                    />
                    <button type="submit" className="rounded-lg bg-primary/20 px-3 py-2 text-white hover:bg-primary/30">use</button>
                  </div>
                  <button type="button" onClick={() => setSaveCodeInput(generateSaveCode())} className="text-xs text-white/40 hover:text-white">
                    Generate a new code
                  </button>
                  {saveCodeError && <p className="text-xs text-red-400">{saveCodeError}</p>}
                </form>
              )}
            </section>
          </aside>

          <main className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
            <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-white/40">
                  <Monitor className="size-4" /> {system.name} library
                </div>
                <h2 className="mt-1 text-2xl font-semibold">Choose a game</h2>
                <p className="mt-1 text-sm text-white/45">Click a title, or use the D-pad and A once a controller is active.</p>
              </div>
              <input
                type="search"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setSelectedIndex(0) }}
                placeholder="Search games…"
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm outline-none placeholder:text-white/30 focus:border-primary/60 sm:max-w-xs"
              />
            </div>

            {!!remoteError && <p className="mt-4 text-xs text-red-400">{remoteError}</p>}
            {games.length === 0 ? (
              <div className="grid min-h-64 place-items-center text-center text-sm text-white/40">
                <div>
                  <Gamepad2 className="mx-auto mb-3 size-8 opacity-50" />
                  {search ? 'No games match your search.' : 'No games yet. Add a ROM below.'}
                </div>
              </div>
            ) : (
              <div ref={gridRef} className="mt-5 grid max-h-[650px] grid-cols-1 gap-3 overflow-y-auto p-1 sm:grid-cols-2 xl:grid-cols-3">
                {games.map((game, index) => {
                  const isSelected = index === safeSelectedIndex
                  const screenshot = gameScreenshots[game.name]
                  return (
                    <div
                      key={game.key}
                      data-game-index={index}
                      onMouseEnter={() => setSelectedIndex(index)}
                      onClick={() => launchGame(game, true)}
                      className={`group cursor-pointer overflow-hidden rounded-xl border transition ${
                        isSelected ? 'border-primary bg-primary/15 ring-1 ring-primary/30' : 'border-white/10 bg-black/15 hover:border-white/25'
                      }`}
                    >
                      <div className="aspect-video overflow-hidden bg-gradient-to-br from-white/10 to-transparent">
                        {screenshot ? (
                          <img src={screenshot} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="grid h-full place-items-center text-4xl font-semibold text-white/15">
                            {prettifyName(system, game.name).charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex items-end justify-between gap-2 p-3">
                        <div className="min-w-0">
                          <div className="truncate font-medium text-white/90">{prettifyName(system, game.name)}</div>
                          <div className="mt-0.5 text-[11px] uppercase tracking-wide text-white/35">{game.kind === 'local' ? formatSize(game.size) : 'Ready to play'}</div>
                        </div>
                        {game.kind === 'local' && (
                          <button
                            type="button"
                            className="text-xs text-white/30 hover:text-red-400"
                            onClick={async (e) => {
                              e.stopPropagation()
                              await deleteRom(system.romDb, game.name)
                              setRoms(await listRoms(system.romDb))
                            }}
                          >
                            remove
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div
              className="mt-5 rounded-xl border border-dashed border-white/15 p-4 text-sm text-white/50 transition hover:border-white/30"
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' }}
              onDrop={onDrop}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-white/70">Bring your own {system.name} games</div>
                  <p className="mt-1 text-xs">ROMs stay in this browser. Only load games you own rights to.</p>
                </div>
                <button type="button" className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-white/80 hover:bg-white/15" onClick={() => fileInputRef.current?.click()} disabled={loading}>
                  <Upload className="size-4" /> {loading ? 'Adding…' : 'Add ROMs'}
                </button>
                <input ref={fileInputRef} type="file" accept={romAcceptAttribute(system)} multiple className="hidden" onChange={(e) => { handleFiles(e.currentTarget.files); e.currentTarget.value = '' }} />
              </div>
              {romUploadError && <p className="mt-2 text-xs text-red-400">{romUploadError}</p>}
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (interfaceStage === 'qr') {
    return (
      <div className="py-6 flex flex-col items-center justify-center min-h-[80vh] space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">{system.name} Emulator</h1>
          <p className="text-xl text-white/70">Connect your mobile controller to start</p>
        </div>

        <div className={`grid grid-cols-1 gap-8 max-w-2xl ${system.maxPlayers > 1 ? 'md:grid-cols-2' : ''}`}>
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

          {system.maxPlayers > 1 && (
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
          )}
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
            onClick={goToLanding}
            className="mt-4 text-xs text-white/60 hover:text-white"
          >
            ← Choose a different control method (B / Esc)
          </button>
        </div>
      </div>
    )
  }

  if (interfaceStage === 'gameSelection') {
    return (
      <div className="py-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Select a Game</h1>
          <p className="text-white/70">
            D-pad / arrows to move, A to play, B to go back.
          </p>
          <p className="text-xs text-white/50">
            Keyboard: arrows or WASD to move · X / Enter = A · Z / Esc = B
          </p>
          <button
            onClick={goToLanding}
            className="text-xs text-white/60 hover:text-white"
          >
            ← Choose a different control method
          </button>
        </div>

        <div className="max-w-6xl mx-auto rounded-lg border border-white/10 bg-white/5 p-4 text-sm">
          {saveCode ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-medium">Cloud saves on</div>
                <div className="text-xs text-white/60">
                  Save code <span className="font-mono text-white">{saveCode}</span>. Enter the same code in any browser to pick up where you left off.
                </div>
                {cloudStatus && <div className="mt-1 text-xs text-white/50">{cloudStatus}</div>}
              </div>
              <button onClick={clearSaveCode} className="text-xs text-white/60 hover:text-white">
                Stop syncing on this browser
              </button>
            </div>
          ) : (
            <form
              className="space-y-2"
              onSubmit={(e) => { e.preventDefault(); applySaveCode(saveCodeInput) }}
            >
              <div>
                <div className="font-medium">Cloud saves</div>
                <div className="text-xs text-white/60">
                  Saves stay in this browser until you choose a save code. Use the same code on another browser to load the same saves. Anyone with the code can load or overwrite them.
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={saveCodeInput}
                  onChange={(e) => { setSaveCodeInput(e.target.value); setSaveCodeError(null) }}
                  placeholder="Save code"
                  className="min-w-0 flex-1 rounded-md bg-white/10 px-3 py-2 text-sm outline-none"
                />
                <button type="submit" className="rounded-md bg-primary/20 px-3 py-2 text-white hover:bg-primary">
                  Use code
                </button>
                <button
                  type="button"
                  onClick={() => setSaveCodeInput(generateSaveCode())}
                  className="rounded-md bg-white/10 px-3 py-2 text-white/80 hover:bg-white/20"
                >
                  Generate
                </button>
              </div>
              {saveCodeError && <div className="text-xs text-red-400">{saveCodeError}</div>}
            </form>
          )}
        </div>

        <div className="max-w-6xl mx-auto">
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSelectedIndex(0) }}
            placeholder="Search games…"
            className="w-full rounded-md bg-white/10 px-3 py-2 text-sm outline-none"
          />
          {!!remoteError && <p className="mt-2 text-xs text-red-400">{remoteError}</p>}
        </div>

        {games.length === 0 ? (
          <div className="text-center text-sm text-white/50">
            {search ? 'No games match your search.' : 'No games yet. Add some ROMs below.'}
          </div>
        ) : (
          <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-6xl mx-auto p-2">
            {games.map((game, index) => {
              const isSelected = index === safeSelectedIndex
              const screenshot = gameScreenshots[game.name]
              return (
                <div
                  key={game.key}
                  data-game-index={index}
                  className={`relative rounded-lg border-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-primary bg-primary/20 scale-105'
                      : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                  }`}
                  onClick={() => launchGame(game, true)}
                >
                  <div className="aspect-video bg-black rounded-t-lg overflow-hidden">
                    {screenshot ? (
                      <img
                        src={screenshot}
                        alt={`${prettifyName(system, game.name)} preview`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl text-white/30">
                        {prettifyName(system, game.name).charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="p-3 flex items-end justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{prettifyName(system, game.name)}</div>
                      <div className="text-xs text-white/50">
                        {game.kind === 'local' ? formatSize(game.size) : 'Remote'}
                      </div>
                    </div>
                    {game.kind === 'local' && (
                      <button
                        className="text-xs text-white/50 hover:text-red-400"
                        title="Delete from library"
                        onClick={async (e) => {
                          e.stopPropagation()
                          await deleteRom(system.romDb, game.name)
                          setRoms(await listRoms(system.romDb))
                        }}
                      >
                        remove
                      </button>
                    )}
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
        )}

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          <div
            className="md:col-span-2 rounded-md border border-dashed border-white/20 p-4 text-sm text-white/70 hover:border-white/40 transition-colors"
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' }}
            onDrop={onDrop}
          >
            <p className="mb-2">Drag and drop ROMs here</p>
            <button className="px-3 py-1.5 rounded bg-primary/20 hover:bg-primary text-white" onClick={() => fileInputRef.current?.click()} disabled={loading}>{loading ? 'Adding…' : 'Add ROMs'}</button>
            <input ref={fileInputRef} type="file" accept={romAcceptAttribute(system)} multiple className="hidden" onChange={(e) => { handleFiles(e.currentTarget.files); e.currentTarget.value = '' }} />
            {romUploadError && <p className="mt-2 text-xs text-red-400">{romUploadError}</p>}
            <p className="mt-2 text-xs text-white/50">
              {system.name} ROMs ({system.romExtensions.map((e) => `.${e}`).join(', ')}) are stored only in this browser; on a new browser, add them again or use the shared library. Only load ROMs you own rights to.
            </p>
          </div>
          <div className="text-xs text-white/60 space-y-2">
            <div className="font-medium text-white/80">In-game keyboard controls</div>
            {system.keyboardHelp.map((line) => <div key={line}>{line}</div>)}
            <div className="font-medium text-white/80 pt-1">Gamepads</div>
            <div>Up to two Bluetooth/USB gamepads, one per player. Press any button to connect. Home or Select + Start opens the in-game menu.</div>
            {gamepads.length === 0
              ? <div className="text-white/50">No gamepads connected</div>
              : gamepads.map((pad) => <div key={pad.player} className="text-green-400">P{pad.player}: {pad.name}</div>)}
            <div className="text-white/50">Controllers connected: {controllerCount} · Pusher: {usePusher ? pusherStatus : 'disabled'}</div>
          </div>
        </div>
      </div>
    )
  }

  // Emulator stage: full-window game view, portalled out of <main>'s stacking context so the navbar can't cover it
  return createPortal(
    <div className="fixed inset-0 z-[60] bg-black">
      <div
        id="ejs-container"
        className="h-full w-full"
        onClick={() => {
          const canvas = document.querySelector('#ejs-container canvas') as HTMLCanvasElement | null
          const iframe = document.querySelector('#ejs-container iframe') as HTMLIFrameElement | null
          if (canvas) canvas.focus()
          else if (iframe) iframe.focus()
        }}
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3">
        <button
          onClick={() => setGlobalMenuOpen(prev => !prev)}
          className="pointer-events-auto px-2.5 py-1.5 text-xs rounded bg-white/10 hover:bg-white/20 text-white/80"
        >
          Menu
        </button>
        <div className="text-center text-xs text-white/60">
          {status && <div className="text-sm text-white/70">{status}</div>}
          {cloudStatus && <div>{cloudStatus}</div>}
          {gamepads.length > 0 && (
            <div>{gamepads.map((pad) => `P${pad.player}: ${pad.name}`).join(' · ')}</div>
          )}
        </div>
        <button
          onClick={toggleFullscreen}
          className="pointer-events-auto px-2.5 py-1.5 text-xs rounded bg-white/10 hover:bg-white/20 text-white/80"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? 'Exit FS' : 'FS'}
        </button>
      </div>

      {audioBlocked && !globalMenuOpen && (
        <div className="pointer-events-none absolute inset-x-0 bottom-8 flex justify-center px-4">
          <div className="max-w-md rounded-xl border border-white/15 bg-black/85 px-5 py-3 text-center shadow-xl">
            <div className="font-medium text-white">Click or press any key to start</div>
            <div className="text-xs text-white/60">
              Browsers need one click or key press before a game can play sound. Gamepad buttons don&apos;t count.
            </div>
          </div>
        </div>
      )}

      {globalMenuOpen && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
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
                Use the D-pad, stick or arrow keys to highlight an option. A confirms, B closes.
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
            <div className="text-center text-[11px] text-white/40">Press Menu again (or Home / Select + Start on a gamepad) to close this panel.</div>
          </div>
        </div>
      )}
    </div>,
    document.body
  )
}
