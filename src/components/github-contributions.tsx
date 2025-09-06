'use client'

import { useEffect, useState } from 'react'

type ContributionDay = {
  count: number
  date: string
  level: 0 | 1 | 2 | 3 | 4
}

type GitHubStats = {
  contributions: ContributionDay[]
  languages: Record<string, { size: number, color: string }>
}

export function GitHubContributions() {
  const [stats, setStats] = useState<GitHubStats>({
    contributions: [],
    languages: {},
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch('/api/github-stats')
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        
        if (data.error) {
          throw new Error(data.error)
        }
        
        setStats({
          contributions: data.contributions || [],
          languages: data.languages || {},
        })
      } catch (error) {
        console.error('Error fetching GitHub stats:', error)
        setError(error instanceof Error ? error.message : 'Failed to load GitHub stats')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return <div className="text-white/60">Loading contributions...</div>
  }

  if (error) {
    return (
      <div className="text-red-400">
        <div className="font-semibold">Error loading contributions:</div>
        <div className="text-sm">{error}</div>
      </div>
    )
  }

  // Calculate total bytes for percentage calculation
  const totalBytes = Object.values(stats.languages).reduce((sum, lang) => sum + lang.size, 0)

  return (
    <div className="w-full space-y-6">
   

      {/* Contribution Graph */}
      <div className="pt-4 border-t border-white/10">
        <h3 className="text-sm text-white/60 mb-2">Contribution Activity</h3>
        <div className="grid grid-cols-[repeat(53,1fr)] gap-1">
          {stats.contributions.map((day, index) => (
            <div
              key={`${day.date}-${index}`}
              className={`
                aspect-square rounded-sm
                ${day.level === 0 && 'bg-white/5'}
                ${day.level === 1 && 'bg-primary/30'}
                ${day.level === 2 && 'bg-primary/50'}
                ${day.level === 3 && 'bg-primary/70'}
                ${day.level === 4 && 'bg-primary'}
              `}
              title={`${day.count} contributions on ${day.date}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
} 
