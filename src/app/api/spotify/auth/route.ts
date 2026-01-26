import { NextResponse } from 'next/server'

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID
const REDIRECT_URI = 'http://localhost:3000/api/spotify/callback'

export async function GET() {
  if (!CLIENT_ID) {
    return NextResponse.json({ error: 'Spotify client ID not configured' }, { status: 500 })
  }

  const scope = [
    'user-read-currently-playing',
    'user-top-read',
    'user-read-recently-played',
    'user-library-read', // For liked tracks
    'playlist-read-private', // For private playlists
    'playlist-read-collaborative', // For collaborative playlists
    'user-follow-read', // For followed artists
  ].join(' ')
  
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: scope
  })

  return NextResponse.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`)
} 