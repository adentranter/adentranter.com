import { NextResponse } from 'next/server'

import { getNowPlaying, getRecentTracks, isLastFmConfigured } from '@/lib/lastfm'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!isLastFmConfigured()) {
    return NextResponse.json(
      { configured: false, nowPlaying: null, recent: [] },
      { status: 200 }
    )
  }

  const [nowPlaying, recent] = await Promise.all([getNowPlaying(), getRecentTracks(8)])

  return NextResponse.json({
    configured: true,
    nowPlaying,
    recent: recent.filter((track) => !track.nowPlaying),
  })
}
