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
    if (!this.accessToken) {
      throw new Error('Failed to obtain access token')
    }
    return this.accessToken
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
  try {
    const client = SpotifyAPIClient.getInstance()
    const data = await client.fetchSpotifyApi('/me/player/currently-playing')
    // Check if data is empty or doesn't have the expected structure
    if (data == null || typeof data !== 'object') {
      return {
        item: null,
        is_playing: false,
        progress_ms: null
      }
    }
    if (Object.keys(data).length === 0 || !('item' in data)) {
      return {
        item: null,
        is_playing: false,
        progress_ms: null
      }
    }
    return CurrentlyPlayingSchema.parse(data)
  } catch (error) {
    console.error('Failed to fetch currently playing:', error)
    return {
      item: null,
      is_playing: false,
      progress_ms: null
    }
  }
}

export async function getTopTracks(timeRange: 'short_term' | 'medium_term' | 'long_term' = 'short_term') {
  try {
    const client = SpotifyAPIClient.getInstance()
    const data = await client.fetchSpotifyApi(`/me/top/tracks?time_range=${timeRange}&limit=5`)
    return z.object({ items: z.array(TrackSchema) }).parse(data)
  } catch (error) {
    console.error('Failed to fetch top tracks:', error)
    return { items: [] }
  }
}

export async function getRecentlyPlayed() {
  try {
    const client = SpotifyAPIClient.getInstance()
    const data = await client.fetchSpotifyApi('/me/player/recently-played?limit=5')
    return RecentlyPlayedSchema.parse(data)
  } catch (error) {
    console.error('Failed to fetch recently played:', error)
    return { items: [] }
  }
}

export async function getSpotifyData() {
  try {
    const [
      currentlyPlaying,
      recentlyPlayed,
      weeklyTopTracks,
      monthlyTopTracks,
      yearlyTopTracks
    ] = await Promise.all([
      getCurrentlyPlaying(),
      getRecentlyPlayed(),
      getTopTracks('short_term'),
      getTopTracks('medium_term'),
      getTopTracks('long_term'),
    ])

    return {
      currentlyPlaying,
      recentlyPlayed: recentlyPlayed.items,
      topTracks: {
        weekly: weeklyTopTracks.items,
        monthly: monthlyTopTracks.items,
        yearly: yearlyTopTracks.items,
      }
    }
  } catch (error) {
    console.error('Failed to fetch Spotify data:', error)
    return {
      currentlyPlaying: {
        item: null,
        is_playing: false,
        progress_ms: null
      },
      recentlyPlayed: [],
      topTracks: {
        weekly: [],
        monthly: [],
        yearly: []
      }
    }
  }
}

// Export helper functions for comprehensive data fetching
interface PaginatedResponse<T> {
  items: T[]
  next: string | null
  total?: number
}

interface SpotifyUser {
  id: string
  display_name?: string
}

interface SpotifyPlaylistItem {
  id: string
  name: string
  description?: string
  owner: {
    id: string
    display_name?: string
  }
  public: boolean
  collaborative: boolean
  snapshot_id?: string
  images?: Array<{ url: string }>
  created_at?: string
}

interface SpotifyPlaylistTrackItem {
  added_at?: string
  track: {
    id: string
    name: string
    artists: Array<{ name: string; id?: string }>
    album: {
      id: string
      name: string
      images?: Array<{ url: string }>
    }
    duration_ms: number
    explicit: boolean
    track_number?: number
    disc_number?: number
    preview_url?: string | null
    external_urls: {
      spotify: string
    }
  }
}

interface SpotifySavedTrack {
  added_at: string
  track: {
    id: string
    name: string
    artists: Array<{ name: string; id?: string }>
    album: {
      id: string
      name: string
    }
    duration_ms: number
    explicit: boolean
    track_number?: number
    disc_number?: number
    preview_url?: string | null
    external_urls: {
      spotify: string
    }
  }
}

interface SpotifyArtist {
  id: string
  name: string
  genres?: string[]
  images?: Array<{ url: string }>
  external_urls: {
    spotify: string
  }
}

/**
 * Fetch user profile data
 */
export async function getUserProfile(): Promise<SpotifyUser> {
  const client = SpotifyAPIClient.getInstance()
  return client.fetchSpotifyApi<SpotifyUser>('/me')
}

/**
 * Fetch all playlists with pagination
 */
export async function getAllPlaylists(): Promise<SpotifyPlaylistItem[]> {
  const client = SpotifyAPIClient.getInstance()
  const allPlaylists: SpotifyPlaylistItem[] = []
  let next: string | null = '/me/playlists?limit=50'

  while (next) {
    const endpoint = next.startsWith('http') ? next.replace(SPOTIFY_API_BASE, '') : next
    const response = await client.fetchSpotifyApi<PaginatedResponse<SpotifyPlaylistItem>>(endpoint)
    allPlaylists.push(...response.items)
    next = response.next
  }

  return allPlaylists
}

/**
 * Fetch all tracks for a specific playlist with pagination
 */
export async function getPlaylistTracks(playlistId: string): Promise<SpotifyPlaylistTrackItem[]> {
  const client = SpotifyAPIClient.getInstance()
  const allTracks: SpotifyPlaylistTrackItem[] = []
  let next: string | null = `/playlists/${playlistId}/tracks?limit=50&market=US`

  while (next) {
    const endpoint = next.startsWith('http') ? next.replace(SPOTIFY_API_BASE, '') : next
    const response = await client.fetchSpotifyApi<PaginatedResponse<SpotifyPlaylistTrackItem>>(endpoint)
    // Filter out null tracks (can happen if track was deleted)
    const validTracks = response.items.filter(item => item.track !== null)
    allTracks.push(...validTracks)
    next = response.next
  }

  return allTracks
}

/**
 * Fetch all liked/saved tracks with pagination
 */
export async function getAllLikedTracks(): Promise<SpotifySavedTrack[]> {
  const client = SpotifyAPIClient.getInstance()
  const allTracks: SpotifySavedTrack[] = []
  let next: string | null = '/me/tracks?limit=50&market=US'

  while (next) {
    const endpoint = next.startsWith('http') ? next.replace(SPOTIFY_API_BASE, '') : next
    const response = await client.fetchSpotifyApi<PaginatedResponse<SpotifySavedTrack>>(endpoint)
    // Filter out null tracks
    const validTracks = response.items.filter(item => item.track !== null)
    allTracks.push(...validTracks)
    next = response.next
  }

  return allTracks
}

/**
 * Fetch all followed artists with pagination
 */
export async function getAllFollowedArtists(): Promise<SpotifyArtist[]> {
  const client = SpotifyAPIClient.getInstance()
  const allArtists: SpotifyArtist[] = []
  let next: string | null = '/me/following?type=artist&limit=50'

  while (next) {
    const endpoint = next.startsWith('http') ? next.replace(SPOTIFY_API_BASE, '') : next
    const response = await client.fetchSpotifyApi<{ artists: PaginatedResponse<SpotifyArtist> }>(endpoint)
    allArtists.push(...response.artists.items)
    next = response.artists.next
  }

  return allArtists
}

export { SpotifyAPIClient }