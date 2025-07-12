'use client'

import { useEffect, useState } from 'react'

type GitHubStats = {
  thirtyDayContributions: number
  mostActiveRepo: string
  currentStreak: number
  linesAdded: number
  linesRemoved: number
  languages?: { name: string; percentage: number; color: string }[]
}

// Simple SVG Pie Chart Component
function PieChart({ data }: { data: { name: string; percentage: number; color: string }[] }) {
  const size = 120
  const center = size / 2
  const radius = 40
  
  // Ensure data is an array and validate it
  const validData = Array.isArray(data) ? data : []
  
  if (validData.length === 0) {
    return <div className="text-white/60 text-center">No data available</div>
  }
  
  // Calculate angles for each slice
  let currentAngle = 0
  const slices = validData.map((item) => {
    const percentage = Math.max(0, Math.min(100, item.percentage || 0))
    const angle = (percentage / 100) * 360
    const startAngle = currentAngle
    const endAngle = currentAngle + angle
    currentAngle += angle
    
    return {
      ...item,
      percentage,
      startAngle,
      endAngle,
      angle
    }
  })
  
  // Create SVG path for each slice
  const createSlicePath = (startAngle: number, endAngle: number) => {
    if (startAngle === endAngle) return ''
    
    const startAngleRad = (startAngle * Math.PI) / 180
    const endAngleRad = (endAngle * Math.PI) / 180
    
    const x1 = center + radius * Math.cos(startAngleRad)
    const y1 = center + radius * Math.sin(startAngleRad)
    const x2 = center + radius * Math.cos(endAngleRad)
    const y2 = center + radius * Math.sin(endAngleRad)
    
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'
    
    return `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`
  }
  
  return (
    <div className="space-y-3">
      <svg width={size} height={size} className="mx-auto">
        {slices.map((slice, index) => {
          const path = createSlicePath(slice.startAngle, slice.endAngle)
          if (!path) return null
          
          return (
            <path
              key={index}
              d={path}
              fill={slice.color}
              className="hover:opacity-80 transition-opacity"
            />
          )
        })}
      </svg>
      
      {/* Legend */}
      <div className="space-y-1">
        {validData.slice(0, 5).map((item, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div 
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-white/60 truncate">{item.name}</span>
            <span className="text-white/40 ml-auto">{item.percentage.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function GitHubStats() {
  const [stats, setStats] = useState<GitHubStats | null>(null)
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
        
        setStats(data)
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
    return <div className="text-white/60">Loading stats...</div>
  }

  if (error) {
    return (
      <div className="text-red-400">
        <div className="font-semibold">Error loading GitHub stats:</div>
        <div className="text-sm">{error}</div>
      </div>
    )
  }

  if (!stats) {
    return <div className="text-white/60">Unable to load GitHub stats</div>
  }

  // Default language data if not provided by API
  const defaultLanguages = [
    { name: 'JavaScript', percentage: 39.0, color: '#f1e05a' },
    { name: 'TypeScript', percentage: 20.2, color: '#3178c6' },
    { name: 'HTML', percentage: 16.8, color: '#e34c26' },
    { name: 'Handlebars', percentage: 12.2, color: '#f0772b' },
    { name: 'CSS', percentage: 5.6, color: '#563d7c' },
    { name: 'Other', percentage: 6.2, color: '#6b7280' }
  ]

  // Ensure languages is always an array
  const languages = Array.isArray(stats.languages) ? stats.languages : defaultLanguages

  return (
    <div className="space-y-4">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="text-2xl font-mono text-primary">{stats.thirtyDayContributions}</div>
          <div className="text-sm text-white/60">Contributions (30d)</div>
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-mono text-primary">{stats.currentStreak} days</div>
          <div className="text-sm text-white/60">Current Streak</div>
        </div>
      </div>

      {/* Most Active Repo */}
      <div className="space-y-1">
        <div className="text-sm text-white/60">Most Active Repo</div>
        <div className="text-lg font-mono text-primary break-all">{stats.mostActiveRepo}</div>
      </div>

      {/* Code Changes and Languages */}
      <div className="pt-2 border-t border-white/10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Code Changes - Stacked Vertically */}
          <div className="space-y-4">
            <div className="text-sm text-white/60">Contributions:</div>
            <div className="space-y-1">
              <div className="text-xl font-mono text-green-400">+{stats.linesAdded.toLocaleString()}</div>
              <div className="text-sm text-white/60">Lines Added (30d)</div>
            </div>
            <div className="space-y-1">
              <div className="text-xl font-mono text-red-400">-{stats.linesRemoved.toLocaleString()}</div>
              <div className="text-sm text-white/60">Lines Removed (30d)</div>
            </div>
            
            {/* Stats Box */}
            <div className="text-xs text-white/40 space-y-1 pt-2">
              <div>Contributions: 371 days</div>
              <div>Languages: 18 total</div>
              <div>Total bytes: 18,316,041</div>
            </div>
          </div>
          
          {/* Languages Pie Chart */}
          <div className="space-y-2">
            <div className="text-sm text-white/60 text-center">Languages</div>
            <PieChart data={languages} />
          </div>
        </div>
      </div>
    </div>
  )
} 