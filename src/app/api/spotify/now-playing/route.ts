import { NextResponse } from 'next/server'
import { getCurrentlyPlaying } from '@/lib/spotify'

export async function GET() {
  const track = await getCurrentlyPlaying()
  return NextResponse.json(track)
} 