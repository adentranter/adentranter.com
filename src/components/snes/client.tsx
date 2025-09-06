"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { deleteRom, getRom, listRoms, putRom, type StoredRomMeta } from "@/lib/idb-roms"

type RemoteRom = { name: string; url: string }

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  const units = ["KB", "MB", "GB"]
  let i = -1
  do { bytes = bytes / 1024; i++ } while (bytes >= 1024 && i < units.length - 1)
  return `${bytes.toFixed(1)} ${units[i]}`
}

export default function SnesClient() {
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

  const shareBase = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}/snes`
  }, [])
  const qr1 = useMemo(() => `https://chart.googleapis.com/chart?cht=qr&chs=180x180&chl=${encodeURIComponent(shareBase + '?player=1')}`,[shareBase])
  const qr2 = useMemo(() => `https://chart.googleapis.com/chart?cht=qr&chs=180x180&chl=${encodeURIComponent(shareBase + '?player=2')}`,[shareBase])

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
        setTimeout(() => setStatus(''), 500)
      } catch (e: any) {
        console.error(e); setStatus(e?.message || 'Failed to start emulator')
      }
    })()
    return () => { cancelled = true }
  }, [activeRomLocal, activeRomRemote, mounted])

  // Fullscreen handling
  useEffect(() => {
    const handler = () => {
      const fs = !!document.fullscreenElement
      setIsFullscreen(fs)
    }
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

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

  return (
    <div className="py-6 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
      {/* Left column: Search + Lists */}
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">SNES</h1>

        {/* Search */}
        <div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search games…"
            className="w-full rounded-md bg-white/10 px-3 py-2 text-sm outline-none"
          />
        </div>

        {/* Remote Library (long list) */}
        {!!remoteError && <p className="text-xs text-red-400">{remoteError}</p>}
        {remoteRoms && remoteRoms.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-lg font-medium">Remote Library</h2>
            <p className="text-xs text-white/60">Files served from <code>/public/roms</code> or <code>/public/snes</code>.</p>
            <ul className="min-h-[80vh] overflow-auto divide-y divide-white/10 rounded border border-white/10">
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

        {/* Local Library (shorter, under remote) */}
        <div className="space-y-2">
          <h2 className="text-lg font-medium">Your Library</h2>
          {roms.length === 0 && (<p className="text-sm text-white/50">No ROMs yet. Upload on the right.</p>)}
          <ul className="max-h-[30vh] overflow-auto divide-y divide-white/10 rounded border border-white/10">
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
      </div>

      {/* Right column: Game view + bottom bar */}
      <div className="space-y-3">
        <div ref={gameViewRef} className="rounded-lg bg-black/50 border border-white/10 p-2 relative">
          <div id="ejs-container" className="aspect-video w-full bg-black" />
          <button
            onClick={toggleFullscreen}
            className="absolute right-3 bottom-3 px-2.5 py-1.5 text-xs rounded bg-white/10 hover:bg-white/20 text-white"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? 'Exit FS' : 'FS'}
          </button>
        </div>
        {status && <div className="text-sm text-white/70">{status}</div>}
        {!activeRomLocal && !activeRomRemote && (<div className="text-sm text-white/60">Select a ROM from the left to start playing.</div>)}
        <div className="text-[11px] text-white/40">Note: Only load ROMs you own rights to. Local files are not uploaded.</div>

        {/* Bottom row: QR codes + Upload */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start pt-2 border-t border-white/10">
          {/* QR codes (two columns on md) */}
          <div className="md:col-span-2 grid grid-cols-2 gap-3">
            <div className="rounded border border-white/10 p-2 text-center">
              <div className="text-xs mb-1">Player 1</div>
              <img src={'/qr1.png'} onError={(e) => { (e.currentTarget as HTMLImageElement).src = qr1 }} alt="Player 1 QR" className="mx-auto" />
            </div>
            <div className="rounded border border-white/10 p-2 text-center">
              <div className="text-xs mb-1">Player 2</div>
              <img src={'/qr2.png'} onError={(e) => { (e.currentTarget as HTMLImageElement).src = qr2 }} alt="Player 2 QR" className="mx-auto" />
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
