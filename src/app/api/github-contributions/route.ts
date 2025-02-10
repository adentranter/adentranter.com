import { NextResponse } from 'next/server'

export async function GET() {
  console.log(process.env.GITHUB_TOKEN);
  const response = await fetch(
    'https://api.github.com/graphql',
    {
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
        `
      }),
    }
  )

  const data = await response.json()
  console.log(data)
  const calendar = data.data.user.contributionsCollection.contributionCalendar
  
  // Process the data into a simpler format
  const contributions = calendar.weeks.flatMap(week => 
    week.contributionDays.map(day => ({
      count: day.contributionCount,
      date: day.date,
      level: getContributionLevel(day.contributionCount)
    }))
  )

  return NextResponse.json({ contributions })
}

function getContributionLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0
  if (count <= 2) return 1
  if (count <= 5) return 2
  if (count <= 8) return 3
  return 4
} 