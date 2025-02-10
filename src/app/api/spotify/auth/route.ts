import { NextResponse } from 'next/server'

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET
const REDIRECT_URI = 'http://localhost:3000/api/spotify/callback'

export async function GET() {
  const scope = 'user-read-currently-playing user-top-read user-read-recently-played'
  
  const params = new URLSearchParams({
    client_id: CLIENT_ID!,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: scope
  })

  return NextResponse.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`)
} 