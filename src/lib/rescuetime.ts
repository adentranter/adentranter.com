type ProductivityBucket = {
  seconds: number
  level: number
}

type DayStats = {
  date: string
  totalHours: number
  productiveHours: number
  veryProductiveHours: number
  distractingHours: number
  neutralHours: number
  allProductiveHours: number
  productivityPulse: number
  topCategories: Array<{ name: string; hours: number }>
}

function requireApiKey(): string {
  const key = process.env.RESCUETIME_API_KEY
  if (!key) {
    throw new Error('RescueTime API key not found in environment variables')
  }
  return key
}

function formatDate(date: Date): string {
  // RescueTime expects YYYY-MM-DD in the account's local day boundaries.
  // Use Australia/Sydney to match this site's owner timezone.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: process.env.RESCUETIME_TIMEZONE || 'Australia/Sydney',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function shiftDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

async function fetchAnalyticData(params: Record<string, string>) {
  const key = requireApiKey()
  const search = new URLSearchParams({ format: 'json', ...params })
  const response = await fetch(
    `https://www.rescuetime.com/anapi/data?${search}`,
    {
      headers: {
        Authorization: `Bearer ${key}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    }
  )

  if (!response.ok) {
    throw new Error(`RescueTime API error: ${response.status} ${response.statusText}`)
  }

  return response.json() as Promise<{
    row_headers?: string[]
    rows?: Array<Array<string | number>>
  }>
}

function secondsToHours(seconds: number): number {
  return seconds / 3600
}

function productivityPulse(buckets: ProductivityBucket[]): number {
  const total = buckets.reduce((sum, bucket) => sum + bucket.seconds, 0)
  if (total <= 0) return 0

  const weighted = buckets.reduce(
    (sum, bucket) => sum + bucket.seconds * bucket.level,
    0
  )

  // RescueTime pulse: map average productivity (-2..2) onto 0..100
  return Math.round(50 + (25 * weighted) / total)
}

function summarizeProductivityRows(
  date: string,
  rows: Array<Array<string | number>>
): Omit<DayStats, 'topCategories'> {
  const buckets: ProductivityBucket[] = rows.map((row) => ({
    seconds: Number(row[1] || 0),
    level: Number(row[3] || 0),
  }))

  const byLevel = (level: number) =>
    buckets
      .filter((bucket) => bucket.level === level)
      .reduce((sum, bucket) => sum + bucket.seconds, 0)

  const veryProductiveSeconds = byLevel(2)
  const productiveSeconds = byLevel(1)
  const neutralSeconds = byLevel(0)
  const distractingSeconds = byLevel(-1) + byLevel(-2)
  const totalSeconds = buckets.reduce((sum, bucket) => sum + bucket.seconds, 0)

  return {
    date,
    totalHours: secondsToHours(totalSeconds),
    productiveHours: secondsToHours(productiveSeconds),
    veryProductiveHours: secondsToHours(veryProductiveSeconds),
    distractingHours: secondsToHours(distractingSeconds),
    neutralHours: secondsToHours(neutralSeconds),
    allProductiveHours: secondsToHours(veryProductiveSeconds + productiveSeconds),
    productivityPulse: productivityPulse(buckets),
  }
}

function topCategoriesFromRows(
  rows: Array<Array<string | number>>,
  limit = 5
): Array<{ name: string; hours: number }> {
  return rows
    .map((row) => ({
      name: String(row[3] || 'Unknown'),
      hours: secondsToHours(Number(row[1] || 0)),
    }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, limit)
}

async function getDayStats(date: string): Promise<DayStats> {
  const [productivity, overview] = await Promise.all([
    fetchAnalyticData({
      perspective: 'rank',
      resolution_time: 'day',
      restrict_kind: 'productivity',
      restrict_begin: date,
      restrict_end: date,
    }),
    fetchAnalyticData({
      perspective: 'rank',
      resolution_time: 'day',
      restrict_kind: 'overview',
      restrict_begin: date,
      restrict_end: date,
    }),
  ])

  const base = summarizeProductivityRows(date, productivity.rows || [])
  return {
    ...base,
    topCategories: topCategoriesFromRows(overview.rows || []),
  }
}

/**
 * Fetches live productivity stats from RescueTime's Analytic Data API.
 * Unlike daily_summary_feed (which excludes today and only rolls up at midnight),
 * this includes the current day as soon as the desktop app has synced.
 */
export async function getRescueTimeStats() {
  try {
    console.log('Fetching RescueTime stats...')

    const today = formatDate(new Date())
    const weekStart = formatDate(shiftDays(new Date(), -6))

    const [todayStats, weekProductivity] = await Promise.all([
      getDayStats(today),
      fetchAnalyticData({
        perspective: 'interval',
        resolution_time: 'day',
        restrict_kind: 'productivity',
        restrict_begin: weekStart,
        restrict_end: today,
      }),
    ])

    // Interval + productivity returns rows like:
    // [date, seconds, people, productivityLevel]
    const byDate = new Map<string, ProductivityBucket[]>()
    for (const row of weekProductivity.rows || []) {
      const date = String(row[0]).slice(0, 10)
      const buckets = byDate.get(date) || []
      buckets.push({
        seconds: Number(row[1] || 0),
        level: Number(row[3] || 0),
      })
      byDate.set(date, buckets)
    }

    const dailyTotals = [...byDate.values()].map((buckets) => {
      const totalSeconds = buckets.reduce((sum, bucket) => sum + bucket.seconds, 0)
      return {
        totalHours: secondsToHours(totalSeconds),
        productivityPulse: productivityPulse(buckets),
      }
    })

    // Always divide by 7 so partial weeks don't inflate the daily average.
    const weekTotalHours = dailyTotals.reduce((sum, day) => sum + day.totalHours, 0)
    const weekPulseSum = dailyTotals.reduce((sum, day) => sum + day.productivityPulse, 0)
    const dayCount = Math.max(dailyTotals.length, 1)

    return {
      today: {
        totalHours: todayStats.totalHours,
        productiveHours: todayStats.productiveHours,
        productivityPulse: todayStats.productivityPulse,
        veryProductiveHours: todayStats.veryProductiveHours,
        topCategories: todayStats.topCategories,
        distractingHours: todayStats.distractingHours,
        neutralHours: todayStats.neutralHours,
        allProductiveHours: todayStats.allProductiveHours,
      },
      week: {
        totalHours: weekTotalHours,
        averageProductivity: weekPulseSum / dayCount,
        dailyAverageHours: weekTotalHours / 7,
      },
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error('RescueTime error:', error.message)
    } else {
      console.error('RescueTime error:', error)
    }
    return null
  }
}
