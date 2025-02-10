import { NextResponse } from 'next/server'
import { getCurrentlyPlaying } from '@/lib/spotify' // You'll need to implement this

export async function GET() {
  const song = await getCurrentlyPlaying()
  return NextResponse.json(song)
} 