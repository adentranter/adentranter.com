'use client'

import { useEffect, useState } from 'react'

type ContributionDay = {
  count: number
  date: string
  level: 0 | 1 | 2 | 3 | 4
}

export function GitHubContributions() {
  const [contributions, setContributions] = useState<ContributionDay[]>([])

  useEffect(() => {
    const fetchContributions = async () => {
      const response = await fetch('/api/github-contributions')
      const data = await response.json()
      setContributions(data.contributions)
    }

    fetchContributions()
  }, [])

  return (
    <div className="w-full pt-4 border-t border-white/10 mt-4">
      <div className="grid grid-cols-[repeat(53,1fr)] gap-1">
        {contributions.map((day) => (
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
  )
} 