import { NextResponse } from 'next/server'

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID

function getRedirectUri(request: Request): string {
  // Use environment variable if set
  if (process.env.SPOTIFY_REDIRECT_URI) {
    return process.env.SPOTIFY_REDIRECT_URI
  }
  
  // Auto-detect from request URL
  const url = new URL(request.url)
  const protocol = url.protocol === 'https:' ? 'https' : 'http'
  const host = url.host
  
  return `${protocol}://${host}/api/spotify/callback`
}

export async function GET(request: Request) {
  if (!CLIENT_ID) {
    return NextResponse.json({ error: 'Spotify client ID not configured' }, { status: 500 })
  }

  const redirectUri = getRedirectUri(request)

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
    redirect_uri: redirectUri,
    scope: scope
  })

  return NextResponse.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`)
} 