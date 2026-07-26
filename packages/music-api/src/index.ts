import { createNavidromeClient, type NavidromeClient } from './navidrome'
import type { MusicApiConfig, MusicListeningPayload, MusicTrack } from './types'

export type { MusicApiConfig, MusicListeningPayload, MusicTrack }
export { createNavidromeClient, NavidromeClient } from './navidrome'

function readEnv(name: string): string | undefined {
  const value = process.env[name]
  return value?.trim() ? value.trim() : undefined
}

export function getNavidromeConfigFromEnv(): MusicApiConfig | null {
  const baseUrl = readEnv('NAVIDROME_URL')
  const username = readEnv('NAVIDROME_USER') || readEnv('NAVIDROME_USERNAME')
  const password = readEnv('NAVIDROME_PASSWORD')

  if (!baseUrl || !username || !password) {
    return null
  }

  return {
    baseUrl,
    username,
    password,
    siteOrigin: readEnv('NEXT_PUBLIC_SITE_URL') || readEnv('SITE_URL'),
    clientName: readEnv('NAVIDROME_CLIENT_NAME') || 'adentranter-com',
  }
}

export function isNavidromeConfigured(): boolean {
  return getNavidromeConfigFromEnv() !== null
}

let cachedClient: NavidromeClient | null = null

export function getNavidromeClient(): NavidromeClient | null {
  const config = getNavidromeConfigFromEnv()
  if (!config) return null

  if (!cachedClient || cachedClient.baseUrl !== config.baseUrl.replace(/\/+$/, '')) {
    cachedClient = createNavidromeClient(config)
  }

  return cachedClient
}

export async function getNowPlaying(): Promise<MusicTrack | null> {
  const client = getNavidromeClient()
  if (!client) return null
  try {
    return await client.getNowPlaying()
  } catch (error) {
    console.error('Failed to fetch now playing from Navidrome:', error)
    return null
  }
}

export async function getRecentTracks(limit = 12): Promise<MusicTrack[]> {
  const client = getNavidromeClient()
  if (!client) return []
  try {
    return await client.getRecentTracks(limit)
  } catch (error) {
    console.error('Failed to fetch recent tracks from Navidrome:', error)
    return []
  }
}

export async function getListening(limit = 8): Promise<MusicListeningPayload> {
  const client = getNavidromeClient()
  if (!client) {
    return { configured: false, nowPlaying: null, recent: [] }
  }

  return client.getListening(limit)
}
