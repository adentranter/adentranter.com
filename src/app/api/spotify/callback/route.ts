import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

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
      redirect_uri: 'http://localhost:3000/api/spotify/callback',
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
