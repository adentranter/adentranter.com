import { NextResponse } from 'next/server'
import { getTopTracks } from '@/lib/spotify'

export async function GET() {
  const tracks = await getTopTracks()
  return NextResponse.json(tracks)
} 