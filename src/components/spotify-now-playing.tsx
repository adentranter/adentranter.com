'use client'

import { useEffect, useState } from 'react'
import { SpotifyIcon } from './icons'

type SpotifyTrack = {
  item: {
    name: string
    artists: Array<{ name: string }>
    album: {
      name: string
    }
  }
}

export function SpotifyNowPlaying() {
  const [track, setTrack] = useState<SpotifyTrack | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNowPlaying = async () => {
      try {
        const response = await fetch('/api/spotify/now-playing')
        const data = await response.json()
        setTrack(data)
      } catch (error) {
        console.error('Failed to fetch now playing:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNowPlaying()
    const interval = setInterval(fetchNowPlaying, 20000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return <div className="h-12 bg-white/10 rounded animate-pulse" />
  }

  if (!track?.item) return null

  return (
    <div className="border rounded-lg p-6 bg-accent/5">
      <div className="flex items-center gap-3 mb-4">
        <SpotifyIcon className="w-6 h-6" />
        <h3 className="text-xl font-bold">Now Playing</h3>
      </div>
      <div className="space-y-2">
        <div className="text-lg font-medium text-primary">{track.item.name}</div>
        <div className="text-sm text-white/60">
          {track.item.artists.map(a => a.name).join(', ')}
        </div>
        <div className="text-sm text-white/40">{track.item.album.name}</div>
      </div>
    </div>
  )
} 