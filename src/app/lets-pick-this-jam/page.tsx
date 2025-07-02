"use client"

// This page relies on client-side routing hooks; disable static optimization
export const dynamic = "force-dynamic"

import { useEffect, useState, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"

interface Track {
  id: string
  name: string
  artists: string
  image: string | null
}

type Participant = "Ann" | "Kate" | "Aden"

const PARTICIPANTS: Participant[] = ["Ann", "Kate", "Aden"]

function JamContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Track[]>([])

  const [currentP, setCurrentP] = useState<Participant>("Ann")
  const [buckets, setBuckets] = useState<Record<Participant, Track[]>>({
    Ann: [],
    Kate: [],
    Aden: [],
  })

  const inputRef = useRef<HTMLInputElement>(null)

  // Load per participant params once
  useEffect(() => {
    const newBuckets: Record<Participant, Track[]> = { Ann: [], Kate: [], Aden: [] }
    const promises: Promise<void>[] = []

    PARTICIPANTS.forEach((p) => {
      const param = searchParams.get(p.toLowerCase())
      if (!param) return
      const ids = param.split(",").filter(Boolean).slice(0, 5)
      if (ids.length === 0) return

      promises.push(
        (async () => {
          try {
            const res = await fetch(`/api/spotify/tracks?ids=${ids.join(",")}`)
            if (!res.ok) return
            const data = await res.json()
            const mapped = (data.items as any[]).map((t) => ({
              id: t.id,
              name: t.name,
              artists: Array.isArray(t.artists) ? t.artists.map((a:any)=>a.name).join(", ") : (t.artists as any),
              image: t.image,
            })) as Track[]
            newBuckets[p] = mapped.slice(0, 5)
          } catch {}
        })()
      )
    })

    Promise.all(promises).then(() => setBuckets(newBuckets))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Escape key handler to clear results and focus input
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setResults([])
        inputRef.current?.focus()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  // Spotify search
  useEffect(() => {
    if (query.trim() === "") return
    const controller = new AbortController()
    const fetchData = async () => {
      const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(query)}`, {
        signal: controller.signal,
      })
      const data = await res.json()
      setResults(data.items as Track[])
    }
    const t = setTimeout(fetchData, 350) // debounce
    return () => {
      clearTimeout(t)
      controller.abort()
    }
  }, [query])

  const toggleTrack = (track: Track) => {
    setBuckets((prev) => {
      const bucket = prev[currentP]
      const exists = bucket.some((t) => t.id === track.id)
      if (exists) {
        return { ...prev, [currentP]: bucket.filter((t) => t.id !== track.id) }
      }
      if (bucket.length >= 5) return prev
      return { ...prev, [currentP]: [...bucket, track] }
    })

    // Hide search list after adding a song
    setResults([])
    setQuery("")
  }

  const shareLink = () => {
    const params = new URLSearchParams()
    PARTICIPANTS.forEach((p) => {
      if (buckets[p].length) params.set(p.toLowerCase(), buckets[p].map((t) => t.id).join(","))
    })
    return `${window.location.origin}/lets-pick-this-jam?${params.toString()}`
  }

  const copyShare = () => {
    const link = shareLink()
    navigator.clipboard.writeText(link)
    alert("Link copied!")
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="max-w-none md:container py-12 space-y-8 flex-grow">
        <h1 className="text-3xl font-light mb-4">Let's pick this jam</h1>

        {/* Participant Switcher */}
        <div className="flex gap-2 mb-6">
          {PARTICIPANTS.map((p) => (
            <button
              key={p}
              onClick={() => setCurrentP(p)}
              className={`px-4 py-2 rounded-full border  transition-colors ${
                currentP === p ? "bg-primary text-background-dark border-primary" : "border-white/20 text-white/70 hover:bg-white/10"
              }`}
            >
              {p}
              <span className="ml-1 text-xs opacity-70">({buckets[p].length}/5)</span>
            </button>
          ))}
        </div>

        <div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Spotify tracks…"
            className="w-full rounded-md bg-white/10 px-4 py-2 outline-none"
            ref={inputRef}
          />
        </div>

        {results.length > 0 && (
          <ul className="divide-y divide-white/10">
            {results.map((r) => (
              <li
                key={r.id}
                className="flex items-center gap-4 py-2 cursor-pointer hover:bg-white/5"
                onClick={() => toggleTrack(r)}
              >
                {r.image && (
                  <Image src={r.image} alt="cover" width={48} height={48} className="rounded" />
                )}
                <div className="flex-1">
                  <p>{r.name}</p>
                  <p className="text-sm text-white/60">{r.artists}</p>
                </div>
                {buckets[currentP].some((t) => t.id === r.id) && <span className="text-primary">✓</span>}
              </li>
            ))}
          </ul>
        )}

        {/* Combined view of all picks */}
        <section className="space-y-10">
          <h2 className="text-2xl font-light">Everyone's picks</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {PARTICIPANTS.map((p) => (
              <div key={p} className="space-y-4">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  {p}
                  <span className="text-xs text-white/60">({buckets[p].length}/5)</span>
                </h3>
                {buckets[p].length === 0 && (
                  <p className="text-white/40 italic">No picks yet.</p>
                )}
                {buckets[p].length > 0 && (
                  <ul className="space-y-3">
                    {buckets[p].map((t) => (
                      <li
                        key={t.id}
                        className="flex items-center gap-3 bg-white/5 p-2 rounded-md cursor-pointer"
                        onClick={() => {
                          if (currentP === p) toggleTrack(t) // only allow removal when viewing own bucket
                        }}
                      >
                        {t.image && (
                          <Image src={t.image} alt="cover" width={40} height={40} className="rounded" />
                        )}
                        <div className="flex-1 overflow-hidden">
                          <p className="text-sm truncate">{t.name}</p>
                          <p className="text-xs text-white/60 truncate">{t.artists}</p>
                        </div>
                        {currentP === p && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleTrack(t)
                            }}
                            className="text-red-400 hover:text-red-300 text-xs"
                          >
                            remove
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {Object.values(buckets).some((b) => b.length > 0) && (
            <button
              onClick={copyShare}
              className="px-6 py-3 rounded-full bg-primary text-background-dark font-medium hover:bg-primary/90 transition-colors"
            >
              Copy share link
            </button>
          )}
        </section>
      </main>
    </div>
  )
}

export default function JamPage() {
  return (
    <Suspense>
      <JamContent />
    </Suspense>
  )
} 