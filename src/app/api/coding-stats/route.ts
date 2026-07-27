import { NextResponse } from 'next/server'
import { getRescueTimeStats } from '@/lib/rescuetime'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const rescuetimeData = await getRescueTimeStats()

    return NextResponse.json(
      {
        today: {
          totalHours: Number(rescuetimeData?.today.totalHours || 0),
          productiveHours: Number(rescuetimeData?.today.productiveHours || 0),
          productivityPulse: Number(rescuetimeData?.today.productivityPulse || 0),
          veryProductiveHours: Number(rescuetimeData?.today.veryProductiveHours || 0),
          distractingHours: Number(rescuetimeData?.today.distractingHours || 0),
          neutralHours: Number(rescuetimeData?.today.neutralHours || 0),
          allProductiveHours: Number(rescuetimeData?.today.allProductiveHours || 0),
          topCategories: rescuetimeData?.today.topCategories || [],
        },
        week: {
          totalHours: Number(rescuetimeData?.week.totalHours || 0),
          averageProductivity: Number(rescuetimeData?.week.averageProductivity || 0),
          dailyAverageHours: Number(rescuetimeData?.week.dailyAverageHours || 0),
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      {
        today: {
          totalHours: 0,
          productiveHours: 0,
          productivityPulse: 0,
          veryProductiveHours: 0,
          distractingHours: 0,
          neutralHours: 0,
          allProductiveHours: 0,
          topCategories: [],
        },
        week: {
          totalHours: 0,
          averageProductivity: 0,
          dailyAverageHours: 0,
        },
      },
      { status: 500 }
    )
  }
}
