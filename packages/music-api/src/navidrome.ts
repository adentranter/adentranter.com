import { createHash, randomBytes } from 'node:crypto'

import type { MusicApiConfig, MusicListeningPayload, MusicTrack } from './types'

const SUBSONIC_VERSION = '1.16.1'

type SubsonicResponse<T> = {
  'subsonic-response': T & {
    status: 'ok' | 'failed'
    error?: { code: number; message: string }
  }
}

type SubsonicChild = {
  id: string
  title?: string
  name?: string
  artist?: string
  album?: string
  albumId?: string
  coverArt?: string
  duration?: number
}

type SubsonicNowPlayingEntry = SubsonicChild & {
  username?: string
  minutesAgo?: number
  playerName?: string
}

type NavidromeSong = {
  id: string
  title?: string
  artist?: string
  album?: string
  albumId?: string
  playDate?: string | null
  updatedAt?: string
}

type AuthCache = {
  token: string
  clientId: string
  expiresAt: number
}

type LoginResponse = {
  token?: string
  id?: string
  subsonicSalt?: string
  subsonicToken?: string
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '')
}

function md5(value: string): string {
  return createHash('md5').update(value).digest('hex')
}

function createAuthParams(username: string, password: string) {
  const salt = randomBytes(6).toString('hex')
  const token = md5(`${password}${salt}`)
  return { u: username, t: token, s: salt }
}

function coverProxyPath(coverArtId: string): string {
  return `/api/music/cover?id=${encodeURIComponent(coverArtId)}`
}

function resolveImageUrl(config: MusicApiConfig, coverArtId: string | null): string | null {
  if (!coverArtId) return null
  const path = coverProxyPath(coverArtId)
  if (!config.siteOrigin) return path
  return `${normalizeBaseUrl(config.siteOrigin)}${path}`
}

function mapSubsonicTrack(
  config: MusicApiConfig,
  entry: SubsonicNowPlayingEntry,
  nowPlaying: boolean
): MusicTrack {
  const coverArtId = entry.coverArt || entry.id || null
  return {
    id: entry.id || null,
    name: entry.title || entry.name || 'Unknown track',
    artist: entry.artist || 'Unknown artist',
    album: entry.album || null,
    url: entry.albumId
      ? `${normalizeBaseUrl(config.baseUrl)}/app/#/album/${entry.albumId}/show`
      : null,
    imageUrl: resolveImageUrl(config, coverArtId),
    coverArtId,
    nowPlaying,
    playedAt: null,
  }
}

function mapNavidromeSong(config: MusicApiConfig, song: NavidromeSong): MusicTrack {
  const coverArtId = song.id || null
  const albumUrl = song.albumId
    ? `${normalizeBaseUrl(config.baseUrl)}/app/#/album/${song.albumId}/show`
    : null

  return {
    id: song.id || null,
    name: song.title || 'Unknown track',
    artist: song.artist || 'Unknown artist',
    album: song.album || null,
    url: albumUrl,
    imageUrl: resolveImageUrl(config, coverArtId),
    coverArtId,
    nowPlaying: false,
    playedAt: song.playDate || null,
  }
}

export class NavidromeClient {
  private readonly config: Required<Pick<MusicApiConfig, 'baseUrl' | 'username' | 'password' | 'clientName'>> &
    Pick<MusicApiConfig, 'siteOrigin'>
  private authCache: AuthCache | null = null

  constructor(config: MusicApiConfig) {
    this.config = {
      baseUrl: normalizeBaseUrl(config.baseUrl),
      username: config.username,
      password: config.password,
      clientName: config.clientName || 'adentranter-music-api',
      siteOrigin: config.siteOrigin,
    }
  }

  get baseUrl(): string {
    return this.config.baseUrl
  }

  private async subsonic<T>(
    endpoint: string,
    params: Record<string, string> = {}
  ): Promise<T | null> {
    const auth = createAuthParams(this.config.username, this.config.password)
    const search = new URLSearchParams({
      ...auth,
      v: SUBSONIC_VERSION,
      c: this.config.clientName,
      f: 'json',
      ...params,
    })

    const response = await fetch(`${this.config.baseUrl}/rest/${endpoint}?${search}`)

    if (!response.ok) {
      throw new Error(`Navidrome Subsonic request failed (${response.status}) for ${endpoint}`)
    }

    const payload = (await response.json()) as SubsonicResponse<T>
    const body = payload['subsonic-response']
    if (!body || body.status !== 'ok') {
      throw new Error(body?.error?.message || `Navidrome Subsonic error for ${endpoint}`)
    }

    return body
  }

  private async login(): Promise<AuthCache> {
    const now = Date.now()
    if (this.authCache && this.authCache.expiresAt > now) {
      return this.authCache
    }

    const body = JSON.stringify({
      username: this.config.username,
      password: this.config.password,
    })

    const endpoints = ['/auth/login', '/api/authenticate'] as const
    let lastError: Error | null = null

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body,
        })

        if (!response.ok) {
          lastError = new Error(`Navidrome login failed (${response.status}) at ${endpoint}`)
          continue
        }

        const data = (await response.json()) as LoginResponse
        const headerToken = response.headers.get('x-nd-authorization')?.replace(/^Bearer\s+/i, '')
        const token = data.token || headerToken
        if (!token) {
          lastError = new Error(`Navidrome login at ${endpoint} did not return a token`)
          continue
        }

        this.authCache = {
          token,
          clientId: data.id || 'adentranter-com',
          expiresAt: now + 10 * 60 * 1000,
        }
        return this.authCache
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
      }
    }

    throw lastError || new Error('Navidrome login failed')
  }

  private async nativeApi<T>(path: string): Promise<T> {
    const auth = await this.login()
    const response = await fetch(`${this.config.baseUrl}${path}`, {
      headers: {
        Accept: 'application/json',
        'x-nd-authorization': `Bearer ${auth.token}`,
        'x-nd-client-unique-id': auth.clientId,
      },
    })

    const refreshed = response.headers.get('x-nd-authorization')?.replace(/^Bearer\s+/i, '')
    if (refreshed && this.authCache) {
      this.authCache = {
        ...this.authCache,
        token: refreshed,
        expiresAt: Date.now() + 10 * 60 * 1000,
      }
    }

    if (!response.ok) {
      // Force re-login next time on auth failures.
      if (response.status === 401) this.authCache = null
      throw new Error(`Navidrome API request failed (${response.status}) for ${path}`)
    }

    return (await response.json()) as T
  }

  async ping(): Promise<boolean> {
    try {
      await this.subsonic('ping.view')
      return true
    } catch {
      return false
    }
  }

  async getNowPlaying(): Promise<MusicTrack | null> {
    const data = await this.subsonic<{
      nowPlaying?: { entry?: SubsonicNowPlayingEntry | SubsonicNowPlayingEntry[] }
    }>('getNowPlaying.view')

    const entries = data?.nowPlaying?.entry
    if (!entries) return null

    const list = Array.isArray(entries) ? entries : [entries]
    const mine =
      list.find(
        (entry) =>
          entry.username?.toLowerCase() === this.config.username.toLowerCase()
      ) || list[0]

    if (!mine) return null
    return mapSubsonicTrack(this.config, mine, true)
  }

  async getRecentTracks(limit = 12): Promise<MusicTrack[]> {
    const end = Math.max(1, Math.min(limit, 50))
    const songs = await this.nativeApi<NavidromeSong[]>(
      `/api/song?_sort=playDate&_order=DESC&_start=0&_end=${end}`
    )

    return (Array.isArray(songs) ? songs : [])
      .filter((song) => Boolean(song.playDate))
      .slice(0, end)
      .map((song) => mapNavidromeSong(this.config, song))
  }

  async getListening(limit = 8): Promise<MusicListeningPayload> {
    const [nowPlaying, recent] = await Promise.all([
      this.getNowPlaying().catch((error) => {
        console.error('Failed to fetch Navidrome now playing:', error)
        return null
      }),
      this.getRecentTracks(limit).catch((error) => {
        console.error('Failed to fetch Navidrome recent tracks:', error)
        return [] as MusicTrack[]
      }),
    ])

    const recentOnly = recent.filter((track) => {
      if (!nowPlaying?.id) return !track.nowPlaying
      return track.id !== nowPlaying.id
    })

    return {
      configured: true,
      nowPlaying,
      recent: recentOnly,
    }
  }

  /**
   * Build an authenticated Subsonic cover-art URL for server-side proxying.
   * Do not send this URL to browsers — it embeds a short-lived auth token.
   */
  getCoverArtUpstreamUrl(coverArtId: string, size = 300): string {
    const auth = createAuthParams(this.config.username, this.config.password)
    const search = new URLSearchParams({
      ...auth,
      v: SUBSONIC_VERSION,
      c: this.config.clientName,
      id: coverArtId,
      size: String(size),
    })
    return `${this.config.baseUrl}/rest/getCoverArt.view?${search}`
  }
}

export function createNavidromeClient(config: MusicApiConfig): NavidromeClient {
  return new NavidromeClient(config)
}
