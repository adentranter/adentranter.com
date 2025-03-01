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

  useEffect(() => {
    const fetchStats = async () => {
      const [contributionsRes, statsRes] = await Promise.all([
        fetch('/api/github-contributions'),
        fetch('/api/github-stats')
      ])
      const contributionsData = await contributionsRes.json()
      const statsData = await statsRes.json()
      
      setStats({
        contributions: contributionsData.contributions,
        languages: statsData.languages || {},
      })
    }

    fetchStats()
  }, [])

  // Calculate total bytes for percentage calculation
  const totalBytes = Object.values(stats.languages).reduce((sum, lang) => sum + lang.size, 0)

  return (
    <div className="w-full space-y-6">
      {/* Language Distribution */}
      <div className="space-y-2">
        <h3 className="text-sm text-white/60">Languages</h3>
        <div className="space-y-2">
          {Object.entries(stats.languages)
            .sort(([, a], [, b]) => b.size - a.size)
            .slice(0, 5)
            .map(([name, { size, color }]) => (
              <div key={name} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{name}</span>
                  <span>{((size / totalBytes) * 100).toFixed(1)}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(size / totalBytes) * 100}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Contribution Graph */}
      <div className="pt-4 border-t border-white/10">
        <div className="grid grid-cols-[repeat(53,1fr)] gap-1">
          {stats.contributions.map((day) => (
            <div
              key={day.date}
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