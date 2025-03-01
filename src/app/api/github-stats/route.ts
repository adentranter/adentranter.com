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
                languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
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
                      history(first: 100, since: "${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}") {
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

  // Calculate lines added/removed in the last 30 days
  const linesStats = repos.reduce((total, repo) => {
    const commits = repo.defaultBranchRef?.target?.history?.nodes || [];
    commits.forEach(commit => {
      total.added += commit.additions || 0;
      total.removed += commit.deletions || 0;
    });
    return total;
  }, { added: 0, removed: 0 });

  return NextResponse.json({
    publicRepos: userData.public_repos,
    followers: userData.followers,
    thirtyDayContributions,
    mostActiveRepo: mostActiveRepo.name,
    currentStreak: 12,
    linesAdded: linesStats.added,
    linesRemoved: linesStats.removed,
    languages: repos.reduce((acc, repo) => {
      if (!repo.languages?.edges) return acc;
      repo.languages.edges.forEach(({ node, size }) => {
        if (!acc[node.name]) {
          acc[node.name] = { size: 0, color: node.color };
        }
        acc[node.name].size += size;
      });
      return acc;
    }, {}),
  })
} 