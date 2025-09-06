'use client'

import { useEffect, useState } from 'react'
import { ChartIcon, SpotifyIcon } from './icons'

type Stats = {
  today: {
    totalHours: number
    productiveHours: number
    productivityPulse: number
    veryProductiveHours: number
    distractingHours: number
    neutralHours: number
    allProductiveHours: number
    topCategories: Array<{
      name: string
      hours: number
    }>
  }
  week: {
    totalHours: number
    averageProductivity: number
    dailyAverageHours: number
  }
  currentlyPlaying: {
    item: {
      id: string
      name: string
      artists: Array<{ name: string }>
    }
  } | null
  recentlyPlayed: Array<{
    track: {
      id: string
      name: string
      artists: Array<{ name: string }>
    }
    playedAt: string
  }>
  topTracks: {
    weekly: Array<{
      id: string
      name: string
      artists: Array<{ name: string }>
    }>
    monthly: Array<{
      id: string
      name: string
      artists: Array<{ name: string }>
    }>
    yearly: Array<{
      id: string
      name: string
      artists: Array<{ name: string }>
    }>
  }
}

export function CodingStats() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/coding-stats')
        const data = await response.json()
        setStats(data)
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 20000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-white/10 rounded w-1/2"></div>
        <div className="h-20 bg-white/10 rounded"></div>
        <div className="h-20 bg-white/10 rounded"></div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <>
    <div className="flex flex-col space-y-8">
      {/* First row - Time Stats and Music now use responsive grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left side - Time Stats - full width on mobile */}
        <div className="lg:col-span-5">
          <div className="flex items-center gap-3 mb-6">
            <ChartIcon className="w-6 h-6" />
            <h3 className="text-2xl font-bold">Daily Activity</h3>
          </div>

          <div className="space-y-6">
            {/* Today's Stats - 2 columns grid maintained */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <div className="text-3xl font-mono text-primary">
                  {stats.today.totalHours.toFixed(1)}h
                </div>
                <div className="text-sm text-white/60">Total Time</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-mono text-primary">
                  {stats.today.allProductiveHours.toFixed(1)}h
                </div>
                <div className="text-sm text-white/60">Productive Time</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-mono text-primary">
                  {stats.today.distractingHours.toFixed(1)}h
                </div>
                <div className="text-sm text-white/60">Distracted Time</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-mono text-primary">
                  {stats.today.productivityPulse}%
                </div>
                <div className="text-sm text-white/60">Productivity</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Music - full width on mobile */}
        <div className="lg:col-span-7">
          <div className="flex flex-col space-y-6">
            <div className="flex items-center gap-3">
              <SpotifyIcon className="w-6 h-6" />
              <h3 className="text-2xl font-bold">Music Activity</h3>
            </div>
            {/* Recently Played Section */}
            <div className="space-y-2">
              <h4 className="text-lg font-semibold text-primary">Recently Played</h4>
              <div className="space-y-2">
                {stats.recentlyPlayed.slice(0, 8).map((item, i) => (
                  <div key={i} className="text-sm">
                    <a 
                      href={`https://open.spotify.com/track/${item.track.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between"
                    >
                      <span 
                        className="text-white group-hover:underline truncate inline-block max-w-[180px] sm:max-w-[200px]" 
                        title={item.track.name}
                      >
                        {item.track.name.length > 30 ? item.track.name.slice(0, 30) + '...' : item.track.name}
                      </span>
                      <span 
                        className="text-white/60 truncate inline-block max-w-[120px] sm:max-w-[150px] text-right" 
                        title={item.track.artists[0].name}
                      >
                        {item.track.artists[0].name.length > 20 
                          ? item.track.artists[0].name.slice(0, 20) + '...' 
                          : item.track.artists[0].name}
                      </span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Second row - Currently Playing and Top Tracks */}
      <div className="w-full border-t border-white/10 pt-4">
        {/* Currently Playing */}
        {stats.currentlyPlaying && stats.currentlyPlaying.item && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-primary mb-2">Now Playing</h4>
            <div className="flex items-center justify-between">
              <span className="text-white truncate max-w-[60%]">
                {stats.currentlyPlaying.item.name}
              </span>
              <span className="text-white/60">
                {stats.currentlyPlaying.item.artists[0].name}
              </span>
            </div>
          </div>
        )}

        {/* Top Tracks Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Weekly Top Tracks */}
          <div className="space-y-2">
            <h4 className="text-lg font-semibold text-primary">Weekly Picks</h4>
            <div className="space-y-1">
              {stats.topTracks.weekly.map((track, i) => (
                <a 
                  key={i}
                  href={`https://open.spotify.com/track/${track.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-white/80 hover:text-white hover:underline truncate"
                  title={`${track.name} - ${track.artists[0].name}`}
                >
                  {track.name}
                </a>
              ))}
            </div>
          </div>

          {/* Monthly Top Tracks */}
          <div className="space-y-2">
            <h4 className="text-lg font-semibold text-primary">Monthly Picks</h4>
            <div className="space-y-1">
              {stats.topTracks.monthly.map((track, i) => (
                <a 
                  key={i}
                  href={`https://open.spotify.com/track/${track.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-white/80 hover:text-white hover:underline truncate"
                  title={`${track.name} - ${track.artists[0].name}`}
                >
                  {track.name}
                </a>
              ))}
            </div>
          </div>

          {/* Yearly Top Tracks */}
          <div className="space-y-2">
            <h4 className="text-lg font-semibold text-primary">Yearly Picks</h4>
            <div className="space-y-1">
              {stats.topTracks.yearly.map((track, i) => (
                <a 
                  key={i}
                  href={`https://open.spotify.com/track/${track.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-white/80 hover:text-white hover:underline truncate"
                  title={`${track.name} - ${track.artists[0].name}`}
                >
                  {track.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
} 
