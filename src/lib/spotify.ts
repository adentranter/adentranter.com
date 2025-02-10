import { z } from 'zod'

// Constants
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1'
const SPOTIFY_TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token'

// Type definitions
interface SpotifyTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
}

interface SpotifyError {
  error: {
    status: number
    message: string
  }
}

// API Configuration
class SpotifyAPIClient {
  private static instance: SpotifyAPIClient
  private accessToken: string | null = null
  private tokenExpirationTime: number = 0

  private constructor() {}

  public static getInstance(): SpotifyAPIClient {
    if (!SpotifyAPIClient.instance) {
      SpotifyAPIClient.instance = new SpotifyAPIClient()
    }
    return SpotifyAPIClient.instance
  }

  private getAuthorizationHeader(): string {
    const credentials = `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
    return `Basic ${Buffer.from(credentials).toString('base64')}`
  }

  private async refreshAccessToken(): Promise<void> {
    if (!process.env.SPOTIFY_REFRESH_TOKEN) {
      throw new Error('Spotify refresh token not found in environment variables')
    }

    try {
      const response = await fetch(SPOTIFY_TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: this.getAuthorizationHeader(),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: process.env.SPOTIFY_REFRESH_TOKEN,
        }),
      })

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`)
      }

      const data = (await response.json()) as SpotifyTokenResponse
      this.accessToken = data.access_token
      this.tokenExpirationTime = Date.now() + (data.expires_in * 1000)
    } catch (error) {
      console.error('Failed to refresh access token:', error)
      throw error
    }
  }

  private async ensureValidToken(): Promise<string> {
    if (!this.accessToken || Date.now() >= this.tokenExpirationTime) {
      await this.refreshAccessToken()
    }
    return this.accessToken!
  }

  public async fetchSpotifyApi<T>(endpoint: string): Promise<T> {
    const maxRetries = 2
    let attempts = 0

    while (attempts < maxRetries) {
      try {
        const accessToken = await this.ensureValidToken()
        const response = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.status === 204) {
          return {} as T
        }

        if (response.status === 401 && attempts < maxRetries - 1) {
          await this.refreshAccessToken()
          attempts++
          continue
        }

        if (!response.ok) {
          const error = await response.json() as SpotifyError
          throw new Error(`Spotify API error: ${error.error.message}`)
        }

        return await response.json() as T
      } catch (error) {
        if (attempts === maxRetries - 1) {
          throw error
        }
        attempts++
      }
    }

    throw new Error('Max retry attempts reached')
  }
}

// Zod schemas for response validation
const TrackSchema = z.object({
  id: z.string(),
  name: z.string(),
  artists: z.array(z.object({ name: z.string() })),
  album: z.object({
    name: z.string(),
    images: z.array(z.object({ url: z.string() })),
  }),
})

const CurrentlyPlayingSchema = z.object({
  item: TrackSchema.nullable(),
  is_playing: z.boolean(),
  progress_ms: z.number().nullable(),
})

const RecentlyPlayedSchema = z.object({
  items: z.array(z.object({
    track: TrackSchema,
    played_at: z.string(),
  })),
})

// API Methods
export async function getCurrentlyPlaying() {
  const client = SpotifyAPIClient.getInstance()
  const data = await client.fetchSpotifyApi('/me/player/currently-playing')
  return CurrentlyPlayingSchema.parse(data)
}

export async function getTopTracks() {
  const client = SpotifyAPIClient.getInstance()
  const data = await client.fetchSpotifyApi('/me/top/tracks?time_range=short_term&limit=5')
  return z.object({ items: z.array(TrackSchema) }).parse(data)
}

export async function getRecentlyPlayed() {
  const client = SpotifyAPIClient.getInstance()
  const data = await client.fetchSpotifyApi('/me/player/recently-played?limit=5')
  return RecentlyPlayedSchema.parse(data)
}

export async function getSpotifyData() {
  try {
    const [currentlyPlaying, recentlyPlayed] = await Promise.all([
      getCurrentlyPlaying(),
      getRecentlyPlayed(),
    ])

    return {
      currentlyPlaying,
      recentlyPlayed: recentlyPlayed.items,
    }
  } catch (error) {
    console.error('Failed to fetch Spotify data:', error)
    throw error
  }
}