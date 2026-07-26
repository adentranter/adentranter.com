import { NextResponse } from 'next/server'

import { getListening } from '@/lib/music'

export const dynamic = 'force-dynamic'

export async function GET() {
  const payload = await getListening(8)

  return NextResponse.json({
    configured: payload.configured,
    source: payload.source,
    nowPlaying: payload.nowPlaying,
    recent: payload.recent,
  })
}
