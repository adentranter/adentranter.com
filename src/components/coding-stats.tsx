'use client'

import { useEffect, useState } from 'react'
import { ChartIcon } from './icons'

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
}

export function CodingStats() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/coding-stats')
        const data = await response.json()
        setStats(data)
        setLastUpdated(new Date())
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
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ChartIcon className="w-6 h-6" />
        <h3 className="text-2xl font-bold">Daily Activity</h3>
      </div>

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
          {lastUpdated && (
            <div className="text-xs text-white/40">
              Updated {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-white/10 pt-4 grid grid-cols-2 gap-4 text-sm text-white/60">
        <div>
          <span className="text-white/40">This week</span>
          <div className="text-lg font-mono text-primary mt-1">
            {stats.week.totalHours.toFixed(1)}h
          </div>
        </div>
        <div>
          <span className="text-white/40">Daily average</span>
          <div className="text-lg font-mono text-primary mt-1">
            {stats.week.dailyAverageHours.toFixed(1)}h
          </div>
        </div>
      </div>
    </div>
  )
}
