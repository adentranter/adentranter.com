'use client'

import { useEffect, useState } from 'react'

type GitHubStats = {
  public_repos: number
  followers: number
  following: number
  created_at: string
  thirtyDayContributions: number
  mostActiveRepo: string
  currentStreak: number
}

export function GitHubStats() {
  const [stats, setStats] = useState<GitHubStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/github-stats')
        const data = await response.json()
        setStats(data)
      } catch (error) {
        console.error('Error fetching GitHub stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return <div className="text-white/60">Loading stats...</div>
  }

  if (!stats) {
    return <div className="text-white/60">Unable to load GitHub stats</div>
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-white/80">Contributions (30d)</span>
        <span className="text-primary font-mono">{stats.thirtyDayContributions}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-white/80">Current Streak</span>
        <span className="text-primary font-mono">{stats.currentStreak} days</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-white/80">Most Active Repo</span>
        <span className="text-primary font-mono">{stats.mostActiveRepo}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-white/80">Public Repos</span>
        <span className="text-primary font-mono">{stats.public_repos}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-white/80">Followers</span>
        <span className="text-primary font-mono">{stats.followers}</span>
      </div>
    </div>
  )
} 