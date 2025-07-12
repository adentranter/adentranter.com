import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Fetch basic user stats
    const userResponse = await fetch('https://api.github.com/users/adentranter', {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      },
    })
    
    if (!userResponse.ok) {
      console.error('User API error:', userResponse.status, userResponse.statusText)
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 })
    }
    
    const userData = await userResponse.json()
    
    // GraphQL query that includes both personal and organization repositories
    const graphqlQuery = {
      query: `
        query {
          user(login: "adentranter") {
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
            repositories(first: 30, orderBy: {field: PUSHED_AT, direction: DESC}) {
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
                      history(first: 30, since: "${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}") {
                        totalCount
                        nodes {
                          additions
                          deletions
                        }
                      }
                    }
                  }
                }
              }
            }
            organizations(first: 20) {
              nodes {
                login
                repositories(first: 30, orderBy: {field: PUSHED_AT, direction: DESC}) {
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
                          history(first: 30, since: "${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}") {
                            totalCount
                            nodes {
                              additions
                              deletions
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
      `
    }
    
    console.log('Sending GraphQL query:', JSON.stringify(graphqlQuery, null, 2))
    
    // Fetch contribution data using GraphQL
    const contributionsResponse = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(graphqlQuery),
    })

    if (!contributionsResponse.ok) {
      console.error('GraphQL API error:', contributionsResponse.status, contributionsResponse.statusText)
      const errorText = await contributionsResponse.text()
      console.error('GraphQL error response:', errorText)
      return NextResponse.json({ error: 'Failed to fetch contribution data' }, { status: 500 })
    }

    const responseText = await contributionsResponse.text()
    console.log('GraphQL response text:', responseText)
    
    let contributionsData
    try {
      contributionsData = JSON.parse(responseText)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.error('Response text:', responseText)
      return NextResponse.json({ error: 'Invalid JSON response from GitHub API' }, { status: 500 })
    }

    if (contributionsData.errors) {
      console.error('GraphQL errors:', contributionsData.errors)
      return NextResponse.json({ error: 'GraphQL query errors', details: contributionsData.errors }, { status: 500 })
    }

    if (!contributionsData.data?.user) {
      console.error('No user data in response:', contributionsData)
      return NextResponse.json({ error: 'No user data found' }, { status: 500 })
    }

    // Process contribution calendar data
    const calendar = contributionsData.data.user.contributionsCollection.contributionCalendar
    const contributions = calendar.weeks.flatMap((week: any) => 
      week.contributionDays.map((day: any) => ({
        count: day.contributionCount,
        date: day.date,
        level: getContributionLevel(day.contributionCount)
      }))
    )

    // Combine personal and organization repositories
    const personalRepos = contributionsData.data.user.repositories?.nodes || []
    const orgRepos = (contributionsData.data.user.organizations?.nodes || []).flatMap(org => 
      (org.repositories?.nodes || []).map(repo => ({
        ...repo,
        fullName: `${org.login}/${repo.name}` // Add organization prefix for identification
      }))
    )
    
    const allRepos = [...personalRepos, ...orgRepos]
    console.log(`Found ${personalRepos.length} personal repos and ${orgRepos.length} org repos`)

    // Calculate most active repo (based on commits in last 30 days)
    const mostActiveRepo = allRepos.reduce((max, repo) => {
      const commitCount = repo.defaultBranchRef?.target?.history?.totalCount || 0
      return commitCount > (max.commitCount || 0)
        ? { name: repo.fullName || repo.name, commitCount }
        : max
    }, { name: '', commitCount: 0 })

    // Get total contributions for last 30 days
    const thirtyDayContributions = contributionsData.data.user.contributionsCollection?.contributionCalendar?.totalContributions || 0

    // Calculate lines added/removed in the last 30 days across all repos
    const linesStats = allRepos.reduce((total, repo) => {
      const commits = repo.defaultBranchRef?.target?.history?.nodes || [];
      commits.forEach(commit => {
        total.added += commit.additions || 0;
        total.removed += commit.deletions || 0;
      });
      return total;
    }, { added: 0, removed: 0 });

    // Calculate current streak (this would need more complex logic to determine actual streak)
    // For now, keeping the placeholder value
    const currentStreak = 12

    const result = {
      publicRepos: userData.public_repos,
      followers: userData.followers,
      thirtyDayContributions,
      mostActiveRepo: mostActiveRepo.name,
      currentStreak,
      linesAdded: linesStats.added,
      linesRemoved: linesStats.removed,
      languages: allRepos.reduce((acc, repo) => {
        if (!repo.languages?.edges) return acc;
        repo.languages.edges.forEach(({ node, size }) => {
          if (!acc[node.name]) {
            acc[node.name] = { size: 0, color: node.color };
          }
          acc[node.name].size += size;
        });
        return acc;
      }, {}),
      contributions, // Add contribution calendar data
    }

    console.log('Final result:', result)
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