import { NextResponse } from 'next/server'

const GITHUB_USER_LOGIN = 'adentranter'

type RepoNode = Record<string, unknown> & { name: string }

/** Shape returned from our repos GraphQL query (used after merge with org fullName). */
type RepoForStats = RepoNode & {
  fullName?: string
  defaultBranchRef?: {
    target?: {
      history?: {
        totalCount?: number
        nodes?: { additions?: number; deletions?: number; committedDate?: string }[]
      }
    }
  }
  languages?: { edges?: { size: number; node: { name: string; color: string | null } }[] }
}

async function githubGraphql<T>(body: object, label: string): Promise<{ ok: true; json: T } | { ok: false; status: number; text: string }> {
  const token = process.env.GITHUB_TOKEN
  if (!token) {
    console.error('GITHUB_TOKEN is not set')
    return { ok: false, status: 500, text: 'missing token' }
  }

  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const text = await res.text()
  if (!res.ok) {
    console.error(`GraphQL ${label} HTTP error:`, res.status, res.statusText, text.slice(0, 500))
    return { ok: false, status: res.status, text }
  }

  try {
    return { ok: true, json: JSON.parse(text) as T }
  } catch {
    console.error(`GraphQL ${label}: invalid JSON`, text.slice(0, 200))
    return { ok: false, status: 502, text: 'invalid JSON' }
  }
}

export async function GET() {
  try {
    const token = process.env.GITHUB_TOKEN
    if (!token) {
      return NextResponse.json({ error: 'Server is missing GITHUB_TOKEN' }, { status: 500 })
    }

    // Fetch basic user stats
    const userResponse = await fetch(`https://api.github.com/users/${GITHUB_USER_LOGIN}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    
    if (!userResponse.ok) {
      console.error('User API error:', userResponse.status, userResponse.statusText)
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 })
    }
    
    const userData = await userResponse.json()

    const since60d = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
    const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    // Split GraphQL: one huge query often hits GitHub execution timeouts (~502) as repos/orgs grow.
    const contributionsQuery = {
      query: `
        query {
          user(login: "${GITHUB_USER_LOGIN}") {
            contributionsCollection {
              contributionCalendar {
                totalContributions
                weeks {
                  contributionDays {
                    contributionCount
                    date
                  }
                }
              }
            }
          }
        }
      `,
    }

    const reposQuery = {
      query: `
        query {
          user(login: "${GITHUB_USER_LOGIN}") {
            repositories(first: 20, orderBy: {field: PUSHED_AT, direction: DESC}) {
              nodes {
                name
                pushedAt
                languages(first: 5, orderBy: {field: SIZE, direction: DESC}) {
                  edges {
                    size
                    node {
                      name
                      color
                    }
                  }
                }
                defaultBranchRef {
                  target {
                    ... on Commit {
                      history(first: 50, since: "${since60d}") {
                        totalCount
                        nodes {
                          additions
                          deletions
                          committedDate
                        }
                      }
                    }
                  }
                }
              }
            }
            organizations(first: 10) {
              nodes {
                login
                repositories(first: 15, orderBy: {field: PUSHED_AT, direction: DESC}) {
                  nodes {
                    name
                    pushedAt
                    languages(first: 5, orderBy: {field: SIZE, direction: DESC}) {
                      edges {
                        size
                        node {
                          name
                          color
                        }
                      }
                    }
                    defaultBranchRef {
                      target {
                        ... on Commit {
                          history(first: 25, since: "${since30d}") {
                            totalCount
                            nodes {
                              additions
                              deletions
                              committedDate
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `,
    }

    const [contributionsResult, reposResult] = await Promise.all([
      githubGraphql<{
        data?: { user?: { contributionsCollection: { contributionCalendar: unknown } } }
        errors?: unknown[]
      }>(contributionsQuery, 'contributions'),
      githubGraphql<{
        data?: {
          user?: {
            repositories: { nodes: RepoNode[] }
            organizations: { nodes: { login: string; repositories?: { nodes: RepoNode[] } }[] }
          }
        }
        errors?: unknown[]
      }>(reposQuery, 'repos'),
    ])

    if (!contributionsResult.ok) {
      return NextResponse.json({ error: 'Failed to fetch contribution data' }, { status: 500 })
    }

    const contributionsData = contributionsResult.json

    if (contributionsData.errors) {
      console.error('GraphQL errors (contributions):', contributionsData.errors)
      return NextResponse.json({ error: 'GraphQL query errors', details: contributionsData.errors }, { status: 500 })
    }

    if (!contributionsData.data?.user?.contributionsCollection) {
      console.error('No user contribution data in response:', contributionsData)
      return NextResponse.json({ error: 'No user data found' }, { status: 500 })
    }

    let repositories = { nodes: [] as RepoNode[] }
    let organizations = { nodes: [] as { login: string; repositories?: { nodes: RepoNode[] } }[] }

    if (reposResult.ok && !reposResult.json.errors && reposResult.json.data?.user) {
      repositories = reposResult.json.data.user.repositories ?? repositories
      organizations = reposResult.json.data.user.organizations ?? organizations
    } else if (reposResult.ok && reposResult.json.errors) {
      console.error('GraphQL errors (repos):', reposResult.json.errors)
    } else if (!reposResult.ok) {
      console.error('Repos GraphQL request failed; continuing with contribution-only stats')
    }

    const contributionsDataMerged = {
      data: {
        user: {
          contributionsCollection: contributionsData.data!.user!.contributionsCollection,
          repositories,
          organizations,
        },
      },
    }

    type ContributionCalendar = {
      totalContributions: number
      weeks: { contributionDays: { contributionCount: number; date: string }[] }[]
    }

    // Process contribution calendar data
    const calendar = contributionsDataMerged.data.user.contributionsCollection
      .contributionCalendar as ContributionCalendar
    const contributions = calendar.weeks.flatMap((week: any) => 
      week.contributionDays.map((day: any) => ({
        count: day.contributionCount,
        date: day.date,
        level: getContributionLevel(day.contributionCount)
      }))
    )

    // Combine personal and organization repositories
    const personalRepos = (contributionsDataMerged.data.user.repositories?.nodes || []) as RepoForStats[]
    const orgRepos = (contributionsDataMerged.data.user.organizations?.nodes || []).flatMap(org =>
      (org.repositories?.nodes || []).map(
        (repo): RepoForStats => ({
          ...repo,
          fullName: `${org.login}/${repo.name}`,
        })
      )
    )

    const allRepos: RepoForStats[] = [...personalRepos, ...orgRepos]
    // Calculate language sizes across repositories

    // Calculate most active repo (based on commits in last 30 days)
    const mostActiveRepo = allRepos.reduce<{ name: string; commitCount: number }>((max, repo) => {
      const commitCount = Number(repo.defaultBranchRef?.target?.history?.totalCount ?? 0)
      return commitCount > max.commitCount
        ? { name: String(repo.fullName ?? repo.name), commitCount }
        : max
    }, { name: '', commitCount: 0 })

    // Get total contributions for last 30 days
    const thirtyDayContributions = calendar.totalContributions || 0

    // Calculate lines added/removed across different time periods
    // Also collect commit timestamps for hourly analysis
    const commitTimestamps: string[] = []
    const now = Date.now()
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000
    const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000
    const fourteenDaysAgo = now - 14 * 24 * 60 * 60 * 1000

    const linesStats = {
      current30d: { added: 0, removed: 0 },
      previous30d: { added: 0, removed: 0 },
      currentWeek: { added: 0, removed: 0 },
      previousWeek: { added: 0, removed: 0 },
    }

    allRepos.forEach(repo => {
      const commits = repo.defaultBranchRef?.target?.history?.nodes || [];
      commits.forEach(commit => {
        if (!commit.committedDate) return
        
        const commitDate = new Date(commit.committedDate).getTime()
        const additions = commit.additions || 0
        const deletions = commit.deletions || 0

        // Current 30 days (0-30 days ago)
        if (commitDate >= thirtyDaysAgo) {
          linesStats.current30d.added += additions
          linesStats.current30d.removed += deletions
        }
        // Previous 30 days (30-60 days ago)
        else if (commitDate >= sixtyDaysAgo && commitDate < thirtyDaysAgo) {
          linesStats.previous30d.added += additions
          linesStats.previous30d.removed += deletions
        }

        // Current week (0-7 days ago)
        if (commitDate >= sevenDaysAgo) {
          linesStats.currentWeek.added += additions
          linesStats.currentWeek.removed += deletions
        }
        // Previous week (7-14 days ago)
        else if (commitDate >= fourteenDaysAgo && commitDate < sevenDaysAgo) {
          linesStats.previousWeek.added += additions
          linesStats.previousWeek.removed += deletions
        }

        commitTimestamps.push(commit.committedDate)
      })
    })

    // Aggregate commits by hour of day (0-23)
    const commitsByHour = Array(24).fill(0)
    commitTimestamps.forEach(timestamp => {
      const date = new Date(timestamp)
      const hour = date.getUTCHours() // Using UTC to be consistent
      commitsByHour[hour]++
    })

    // Calculate current streak from contribution calendar
    // Create a map of dates to contribution counts for quick lookup
    const contributionMap = new Map<string, number>(
      contributions.map((c): [string, number] => [
        String(c.date),
        Number(c.count),
      ])
    )
    
    // Find the most recent day (could be today or yesterday depending on timezone)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const todayStr = today.toISOString().split('T')[0]
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    
    // Determine starting point: if today has contributions, start there; otherwise check yesterday
    let currentDate: Date | null = null
    if (contributionMap.get(todayStr) && contributionMap.get(todayStr)! > 0) {
      currentDate = new Date(today)
    } else if (contributionMap.get(yesterdayStr) && contributionMap.get(yesterdayStr)! > 0) {
      currentDate = new Date(yesterday)
    }
    
    // Count backwards consecutive days with contributions
    let streak = 0
    if (currentDate) {
      while (currentDate) {
        const dateStr = currentDate.toISOString().split('T')[0]
        const count = contributionMap.get(dateStr) || 0
        
        if (count > 0) {
          streak++
          currentDate.setDate(currentDate.getDate() - 1)
        } else {
          break
        }
      }
    }
    
    const currentStreak = streak

    // Reduce language sizes to percentage array (top 8)
    const languageSizeMap: Record<string, { size: number; color: string | null }> = allRepos.reduce((acc, repo) => {
      if (!repo.languages?.edges) return acc
      repo.languages.edges.forEach(({ node, size }: any) => {
        if (!acc[node.name]) {
          acc[node.name] = { size: 0, color: node.color || null }
        }
        acc[node.name].size += size
      })
      return acc
    }, {} as Record<string, { size: number; color: string | null }>)

    const totalBytes = Object.values(languageSizeMap).reduce((sum, l) => sum + l.size, 0) || 1
    const languagesArray = Object.entries(languageSizeMap)
      .map(([name, { size, color }]) => ({
        name,
        percentage: (size / totalBytes) * 100,
        color: color || '#6b7280',
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 8)

    // Calculate total days with contributions (all time)
    const totalDaysWithContributions = contributions.filter(c => c.count > 0).length
    
    // Count total unique languages
    const totalLanguages = Object.keys(languageSizeMap).length

    // Calculate longest streak
    let longestStreak = 0
    let tempStreak = 0
    for (const day of contributions) {
      if (day.count > 0) {
        tempStreak++
        longestStreak = Math.max(longestStreak, tempStreak)
      } else {
        tempStreak = 0
      }
    }

    // Find best day (most contributions in a single day)
    const bestDay = contributions.reduce((best, day) => 
      day.count > best.count ? day : best, 
      { count: 0, date: '', level: 0 as const }
    )

    // Calculate total commits across all repos (last 30 days)
    const totalCommits = allRepos.reduce((sum, repo) => {
      return sum + Number(repo.defaultBranchRef?.target?.history?.totalCount ?? 0)
    }, 0)

    // Calculate average contributions per day (all time)
    const totalContributions = contributions.reduce((sum, day) => sum + day.count, 0)
    const averageContributionsPerDay = totalDaysWithContributions > 0 
      ? (totalContributions / totalDaysWithContributions).toFixed(1)
      : 0

    // Total repositories (personal + org)
    const totalRepositories = allRepos.length

    const result = {
      publicRepos: userData.public_repos,
      followers: userData.followers,
      thirtyDayContributions,
      mostActiveRepo: mostActiveRepo.name,
      currentStreak,
      linesAdded: linesStats.current30d.added,
      linesRemoved: linesStats.current30d.removed,
      linesAddedPreviousMonth: linesStats.previous30d.added,
      linesRemovedPreviousMonth: linesStats.previous30d.removed,
      linesAddedCurrentWeek: linesStats.currentWeek.added,
      linesRemovedCurrentWeek: linesStats.currentWeek.removed,
      linesAddedPreviousWeek: linesStats.previousWeek.added,
      linesRemovedPreviousWeek: linesStats.previousWeek.removed,
      // Keep languages as size map for backward compatibility
      languages: languageSizeMap,
      // New: array of languages with percentages for charting
      languagesArray,
      contributions, // Add contribution calendar data
      // Additional stats
      totalDaysWithContributions,
      totalLanguages,
      totalBytes,
      longestStreak,
      bestDay: bestDay.count > 0 ? { date: bestDay.date, count: bestDay.count } : null,
      totalCommits,
      averageContributionsPerDay,
      totalRepositories,
      commitsByHour, // Array of 24 numbers representing commits per hour (0-23)
    }
    return NextResponse.json(result)

  } catch (error) {
    console.error('Unexpected error in GitHub stats API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getContributionLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0
  if (count <= 2) return 1
  if (count <= 5) return 2
  if (count <= 8) return 3
  return 4
} 
