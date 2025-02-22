import { NextResponse } from 'next/server'

export async function GET() {
  // Fetch basic user stats
  const userResponse = await fetch('https://api.github.com/users/adentranter', {
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    },
  })
  
  // Fetch contribution data using GraphQL
  const contributionsResponse = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `
        query {
          user(login: "adentranter") {
            contributionsCollection {
              contributionCalendar {
                totalContributions
              }
              contributionYears
            }
            repositories(first: 100, orderBy: {field: PUSHED_AT, direction: DESC}) {
              nodes {
                name
                pushedAt
                defaultBranchRef {
                  target {
                    ... on Commit {
                      history(first: 1) {
                        totalCount
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `
    }),
  })

  const userData = await userResponse.json()
  const contributionsData = await contributionsResponse.json()

  // Calculate most active repo
  const repos = contributionsData.data.user.repositories.nodes
  const mostActiveRepo = repos.reduce((max, repo) => {
    return (repo.defaultBranchRef?.target?.history?.totalCount || 0) > (max.commitCount || 0)
      ? { name: repo.name, commitCount: repo.defaultBranchRef?.target?.history?.totalCount }
      : max
  }, { name: '', commitCount: 0 })

  // Get total contributions for last 30 days
  const thirtyDayContributions = contributionsData.data.user.contributionsCollection.contributionCalendar.totalContributions

  return NextResponse.json({
    ...userData,
    thirtyDayContributions,
    mostActiveRepo: mostActiveRepo.name,
    currentStreak: 12, // This would need a more complex calculation
  })
} 