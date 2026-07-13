import { NextResponse } from 'next/server'

const GITHUB_USER_LOGIN = 'adentranter'
const PERIOD_DAYS = 30
const MAX_REPOS_FOR_LINES = 8
const HISTORY_PAGE_SIZE = 100

type ContributionDay = {
  count: number
  date: string
  level: 0 | 1 | 2 | 3 | 4
}

type RepoContribution = {
  name: string
  url: string
  commits: number
}

type GraphqlResult<T> =
  | { ok: true; json: T }
  | { ok: false; status: number; text: string }

async function githubGraphql<T>(
  body: object,
  label: string
): Promise<GraphqlResult<T>> {
  const token = process.env.GITHUB_TOKEN
  if (!token) {
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
    console.error(`GraphQL ${label} HTTP error:`, res.status, text.slice(0, 400))
    return { ok: false, status: res.status, text }
  }

  try {
    return { ok: true, json: JSON.parse(text) as T }
  } catch {
    console.error(`GraphQL ${label}: invalid JSON`, text.slice(0, 200))
    return { ok: false, status: 502, text: 'invalid JSON' }
  }
}

function getContributionLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0
  if (count <= 2) return 1
  if (count <= 5) return 2
  if (count <= 8) return 3
  return 4
}

function splitOwnerName(fullName: string): { owner: string; name: string } | null {
  const [owner, name] = fullName.split('/')
  if (!owner || !name) return null
  return { owner, name }
}

export async function GET() {
  try {
    if (!process.env.GITHUB_TOKEN) {
      return NextResponse.json({ error: 'Server is missing GITHUB_TOKEN' }, { status: 500 })
    }

    const to = new Date()
    const from = new Date(Date.now() - PERIOD_DAYS * 24 * 60 * 60 * 1000)
    const fromIso = from.toISOString()
    const toIso = to.toISOString()

    const overviewQuery = {
      query: `
        query($login: String!, $from: DateTime!, $to: DateTime!) {
          user(login: $login) {
            id
            contributionsCollection(from: $from, to: $to) {
              totalCommitContributions
              totalRepositoriesWithContributedCommits
              commitContributionsByRepository(maxRepositories: 25) {
                contributions { totalCount }
                repository { nameWithOwner url }
              }
            }
            year: contributionsCollection {
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
      variables: {
        login: GITHUB_USER_LOGIN,
        from: fromIso,
        to: toIso,
      },
    }

    type OverviewJson = {
      data?: {
        user?: {
          id: string
          contributionsCollection: {
            totalCommitContributions: number
            totalRepositoriesWithContributedCommits: number
            commitContributionsByRepository: Array<{
              contributions: { totalCount: number }
              repository: { nameWithOwner: string; url: string }
            }>
          }
          year: {
            contributionCalendar: {
              totalContributions: number
              weeks: Array<{
                contributionDays: Array<{ contributionCount: number; date: string }>
              }>
            }
          }
        }
      }
      errors?: unknown[]
    }

    const overviewResult = await githubGraphql<OverviewJson>(overviewQuery, 'overview')
    if (!overviewResult.ok) {
      return NextResponse.json({ error: 'Failed to fetch GitHub activity' }, { status: 500 })
    }

    if (overviewResult.json.errors || !overviewResult.json.data?.user) {
      console.error('GitHub overview errors:', overviewResult.json.errors)
      return NextResponse.json({ error: 'GitHub returned no user data' }, { status: 500 })
    }

    const user = overviewResult.json.data.user
    const period = user.contributionsCollection
    const calendar = user.year.contributionCalendar

    const repos: RepoContribution[] = period.commitContributionsByRepository
      .map((entry) => ({
        name: entry.repository.nameWithOwner,
        url: entry.repository.url,
        commits: entry.contributions.totalCount,
      }))
      .filter((repo) => repo.commits > 0)
      .sort((a, b) => b.commits - a.commits)

    const contributions: ContributionDay[] = calendar.weeks.flatMap((week) =>
      week.contributionDays.map((day) => ({
        count: day.contributionCount,
        date: day.date,
        level: getContributionLevel(day.contributionCount),
      }))
    )

    // Lines changed: only commits authored by this user on each repo's default branch.
    // Query repos individually — one big aliased query often 502s on GitHub's GraphQL gateway.
    const reposForLines = repos
      .slice(0, MAX_REPOS_FOR_LINES)
      .map((repo) => ({ ...repo, parts: splitOwnerName(repo.name) }))
      .filter((repo): repo is RepoContribution & { parts: { owner: string; name: string } } =>
        Boolean(repo.parts)
      )

    let linesAdded = 0
    let linesRemoved = 0

    const lineResults = await Promise.all(
      reposForLines.map(async (repo) => {
        const result = await githubGraphql<{
          data?: {
            repository?: {
              defaultBranchRef?: {
                target?: {
                  history?: { nodes?: Array<{ additions?: number; deletions?: number }> }
                }
              }
            } | null
          }
          errors?: unknown[]
        }>(
          {
            query: `
              query($owner: String!, $name: String!, $since: GitTimestamp!, $authorId: ID!) {
                repository(owner: $owner, name: $name) {
                  defaultBranchRef {
                    target {
                      ... on Commit {
                        history(first: ${HISTORY_PAGE_SIZE}, since: $since, author: { id: $authorId }) {
                          nodes { additions deletions }
                        }
                      }
                    }
                  }
                }
              }
            `,
            variables: {
              owner: repo.parts.owner,
              name: repo.parts.name,
              since: fromIso,
              authorId: user.id,
            },
          },
          `lines:${repo.name}`
        )

        if (!result.ok || result.json.errors) {
          if (result.ok && result.json.errors) {
            console.error(`GitHub lines errors (${repo.name}):`, result.json.errors)
          }
          return { added: 0, removed: 0 }
        }

        const commits =
          result.json.data?.repository?.defaultBranchRef?.target?.history?.nodes || []
        return commits.reduce(
          (acc, commit) => ({
            added: acc.added + (commit.additions || 0),
            removed: acc.removed + (commit.deletions || 0),
          }),
          { added: 0, removed: 0 }
        )
      })
    )

    for (const result of lineResults) {
      linesAdded += result.added
      linesRemoved += result.removed
    }

    return NextResponse.json(
      {
        login: GITHUB_USER_LOGIN,
        periodDays: PERIOD_DAYS,
        commits: period.totalCommitContributions,
        reposWorkedOn: period.totalRepositoriesWithContributedCommits,
        linesAdded,
        linesRemoved,
        repos,
        yearContributions: calendar.totalContributions,
        contributions,
        profileUrl: `https://github.com/${GITHUB_USER_LOGIN}`,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    )
  } catch (error) {
    console.error('Unexpected error in GitHub stats API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
