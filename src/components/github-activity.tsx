'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { GitHubIcon } from '@/components/icons'

type ContributionDay = {
  count: number
  date: string
  level: 0 | 1 | 2 | 3 | 4
}

type RepoActivity = {
  name: string
  url: string
  commits: number
}

type GitHubActivityData = {
  login: string
  periodDays: number
  commits: number
  reposWorkedOn: number
  linesAdded: number
  linesRemoved: number
  repos: RepoActivity[]
  yearContributions: number
  contributions: ContributionDay[]
  profileUrl: string
}

function formatCount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 10_000) return `${Math.round(value / 1000)}k`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`
  return value.toLocaleString()
}

function ContributionGraph({ days }: Readonly<{ days: ContributionDay[] }>) {
  if (days.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <h4 className="text-sm text-white/55">Contribution activity</h4>
        <p className="text-xs text-white/35">{days.length} days</p>
      </div>
      <div className="overflow-x-auto pb-1">
        <div className="grid min-w-[640px] grid-cols-[repeat(53,minmax(0,1fr))] gap-1">
          {days.map((day, index) => (
            <div
              key={`${day.date}-${index}`}
              className={`
                aspect-square rounded-sm
                ${day.level === 0 ? 'bg-white/5' : ''}
                ${day.level === 1 ? 'bg-primary/30' : ''}
                ${day.level === 2 ? 'bg-primary/50' : ''}
                ${day.level === 3 ? 'bg-primary/70' : ''}
                ${day.level === 4 ? 'bg-primary' : ''}
              `}
              title={`${day.count} contributions on ${day.date}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export function GitHubActivity() {
  const [data, setData] = useState<GitHubActivityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/github-stats')
        const payload = await response.json()

        if (!response.ok || payload.error) {
          throw new Error(payload.error || `HTTP ${response.status}`)
        }

        if (!cancelled) setData(payload as GitHubActivityData)
      } catch (err) {
        console.error('Error fetching GitHub activity:', err)
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load GitHub activity')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 rounded bg-white/10" />
        <div className="h-16 rounded bg-white/10" />
        <div className="h-24 rounded bg-white/10" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-400 text-sm">
        <p className="font-semibold">Couldn&apos;t load GitHub activity</p>
        <p className="text-red-400/80">{error}</p>
      </div>
    )
  }

  if (!data) return null

  const topRepos = data.repos.slice(0, 6)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3 text-white">
          <GitHubIcon className="w-6 h-6" />
          <div>
            <h3 className="text-2xl font-bold">GitHub</h3>
            <p className="text-sm text-white/50">
              Last {data.periodDays} days · only commits by {data.login}
            </p>
          </div>
        </div>
        <Link
          href={data.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:text-accent-secondary transition-colors"
        >
          View profile →
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="space-y-1">
          <div className="text-2xl font-mono text-primary">{formatCount(data.commits)}</div>
          <div className="text-sm text-white/55">Commits</div>
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-mono text-green-400">+{formatCount(data.linesAdded)}</div>
          <div className="text-sm text-white/55">Lines added</div>
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-mono text-red-400">-{formatCount(data.linesRemoved)}</div>
          <div className="text-sm text-white/55">Lines removed</div>
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-mono text-primary">{data.reposWorkedOn}</div>
          <div className="text-sm text-white/55">Repos touched</div>
        </div>
      </div>

      {topRepos.length > 0 ? (
        <div className="space-y-3">
          <h4 className="text-sm text-white/55">Projects worked on</h4>
          <ul className="space-y-2">
            {topRepos.map((repo) => (
              <li key={repo.name} className="flex items-baseline justify-between gap-4 text-sm">
                <Link
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-primary hover:text-accent-secondary transition-colors"
                >
                  {repo.name}
                </Link>
                <span className="shrink-0 font-mono text-white/45">
                  {repo.commits} {repo.commits === 1 ? 'commit' : 'commits'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <ContributionGraph days={data.contributions} />

      <p className="text-xs text-white/35">
        {formatCount(data.yearContributions)} contributions in the past year
      </p>
    </div>
  )
}
