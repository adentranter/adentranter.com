import { NextResponse } from 'next/server'

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
  try {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  const redirectUri = getRedirectUri(request)

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
      ).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code!,
      redirect_uri: redirectUri,
    }),
  })

  // Intentionally do not log tokens
  await response.json()
  
  return NextResponse.redirect('/')
  } catch (error) {
    console.error('Error in Spotify callback:', error)
    return NextResponse.redirect('/error')
  }
} 
