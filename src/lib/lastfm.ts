const LASTFM_API_BASE = 'https://ws.audioscrobbler.com/2.0/'

export type MusicTrack = {
  name: string
  artist: string
  album: string | null
  url: string | null
  imageUrl: string | null
  nowPlaying: boolean
  playedAt: string | null
}

type LastFmImage = {
  size: string
  '#text': string
}

type LastFmRecentTrack = {
  name: string
  url?: string
  artist: { '#text'?: string; name?: string } | string
  album?: { '#text'?: string }
  image?: LastFmImage[]
  date?: { uts?: string; '#text'?: string }
  '@attr'?: { nowplaying?: string }
}

function getConfig() {
  const apiKey = process.env.LASTFM_API_KEY
  const username = process.env.LASTFM_USERNAME

  if (!apiKey || !username) {
    return null
  }

  return { apiKey, username }
}

function pickImage(images: LastFmImage[] | undefined): string | null {
  if (!images?.length) return null

  const preferred =
    images.find((image) => image.size === 'extralarge') ||
    images.find((image) => image.size === 'large') ||
    images.find((image) => image.size === 'medium') ||
    images.at(-1)

  const url = preferred?.['#text']?.trim()
  return url || null
}

function artistName(artist: LastFmRecentTrack['artist']): string {
  if (typeof artist === 'string') return artist
  return artist?.['#text'] || artist?.name || 'Unknown artist'
}

function mapTrack(track: LastFmRecentTrack): MusicTrack {
  const nowPlaying = track['@attr']?.nowplaying === 'true'
  const playedAtUnix = track.date?.uts ? Number(track.date.uts) : null

  return {
    name: track.name,
    artist: artistName(track.artist),
    album: track.album?.['#text'] || null,
    url: track.url || null,
    imageUrl: pickImage(track.image),
    nowPlaying,
    playedAt: playedAtUnix && Number.isFinite(playedAtUnix)
      ? new Date(playedAtUnix * 1000).toISOString()
      : null,
  }
}

async function fetchLastFm<T>(method: string, params: Record<string, string> = {}): Promise<T | null> {
  const config = getConfig()
  if (!config) return null

  const search = new URLSearchParams({
    method,
    user: config.username,
    api_key: config.apiKey,
    format: 'json',
    ...params,
  })

  const response = await fetch(`${LASTFM_API_BASE}?${search.toString()}`, {
    next: { revalidate: 60 },
  })

  if (!response.ok) {
    throw new Error(`Last.fm request failed (${response.status})`)
  }

  return (await response.json()) as T
}

export function isLastFmConfigured(): boolean {
  return getConfig() !== null
}

export async function getRecentTracks(limit = 12): Promise<MusicTrack[]> {
  try {
    const data = await fetchLastFm<{
      recenttracks?: { track?: LastFmRecentTrack | LastFmRecentTrack[] }
    }>('user.getrecenttracks', { limit: String(limit) })

    if (!data) return []

    const tracks = data.recenttracks?.track
    if (!tracks) return []

    return (Array.isArray(tracks) ? tracks : [tracks]).map(mapTrack)
  } catch (error) {
    console.error('Failed to fetch Last.fm recent tracks:', error)
    return []
  }
}

export async function getNowPlaying(): Promise<MusicTrack | null> {
  const tracks = await getRecentTracks(1)
  const current = tracks[0]
  if (!current) return null
  return current.nowPlaying ? current : null
}

export function getLastFmProfileUrl(): string | null {
  const username = process.env.LASTFM_USERNAME
  return username ? `https://www.last.fm/user/${encodeURIComponent(username)}` : null
}
