export async function getWakaTimeStats() {
  const response = await fetch('https://wakatime.com/api/v1/users/current/stats/last_7_days', {
    headers: {
      Authorization: `Basic ${Buffer.from(process.env.WAKATIME_API_KEY || '').toString('base64')}`
    }
  })
  return response.json()
} 