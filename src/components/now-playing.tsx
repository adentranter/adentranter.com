'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import type { MusicTrack } from '@adentranter/music-api/types'

type MusicPayload = {
  configured: boolean
  nowPlaying: MusicTrack | null
  recent: MusicTrack[]
}

export function NowPlaying() {
  const [data, setData] = useState<MusicPayload | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const response = await fetch('/api/music/now-playing', { cache: 'no-store' })
        const payload = (await response.json()) as MusicPayload
        if (!cancelled) setData(payload)
      } catch (error) {
        console.error('Failed to fetch now playing:', error)
        if (!cancelled) setData({ configured: false, nowPlaying: null, recent: [] })
      }
    }

    load()
    const interval = setInterval(load, 30_000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  if (!data) {
    return <div className="h-28 rounded-lg border border-white/10 bg-accent/5 animate-pulse" />
  }

  if (!data.configured) {
    return null
  }

  const featured = data.nowPlaying || data.recent[0] || null
  if (!featured) {
    return null
  }

  const listeningNow = Boolean(data.nowPlaying)

  return (
    <article className="rounded-lg border border-white/10 bg-accent/5 p-6 sm:p-7">
      <div className="flex flex-col sm:flex-row gap-5 sm:items-center">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-md bg-white/5">
          {featured.imageUrl ? (
            <Image
              src={featured.imageUrl}
              alt={`${featured.name} album art`}
              fill
              className="object-cover"
              sizes="80px"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center text-white/30 text-xs">♪</div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs uppercase tracking-[0.18em] text-white/45">
            {listeningNow ? 'Now playing' : 'Last played'}
          </p>
          {featured.url ? (
            <Link
              href={featured.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block truncate text-lg font-medium text-primary hover:text-accent-secondary transition-colors"
            >
              {featured.name}
            </Link>
          ) : (
            <p className="truncate text-lg font-medium">{featured.name}</p>
          )}
          <p className="truncate text-sm text-white/70">{featured.artist}</p>
          {featured.album ? (
            <p className="truncate text-xs text-white/40">{featured.album}</p>
          ) : null}
        </div>

        <Link
          href="/distractions/music"
          className="text-sm text-primary hover:text-accent-secondary transition-colors shrink-0"
        >
          More music →
        </Link>
      </div>
    </article>
  )
}
