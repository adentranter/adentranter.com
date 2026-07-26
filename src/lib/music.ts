import {
  getListening as getNavidromeListening,
  getNavidromeClient,
  getNowPlaying as getNavidromeNowPlaying,
  getRecentTracks as getNavidromeRecentTracks,
  isNavidromeConfigured,
  type MusicTrack as NavidromeMusicTrack,
} from '@adentranter/music-api'

import {
  getNowPlaying as getLastFmNowPlaying,
  getRecentTracks as getLastFmRecentTracks,
  isLastFmConfigured,
  type MusicTrack as LastFmMusicTrack,
} from '@/lib/lastfm'

export type MusicTrack = {
  id: string | null
  name: string
  artist: string
  album: string | null
  url: string | null
  imageUrl: string | null
  coverArtId: string | null
  nowPlaying: boolean
  playedAt: string | null
}

export type MusicListeningPayload = {
  configured: boolean
  source: 'navidrome' | 'lastfm' | null
  nowPlaying: MusicTrack | null
  recent: MusicTrack[]
}

function fromNavidrome(track: NavidromeMusicTrack): MusicTrack {
  return { ...track }
}

function fromLastFm(track: LastFmMusicTrack): MusicTrack {
  return {
    id: null,
    name: track.name,
    artist: track.artist,
    album: track.album,
    url: track.url,
    imageUrl: track.imageUrl,
    coverArtId: null,
    nowPlaying: track.nowPlaying,
    playedAt: track.playedAt,
  }
}

export function isMusicConfigured(): boolean {
  return isNavidromeConfigured() || isLastFmConfigured()
}

export function getMusicSource(): 'navidrome' | 'lastfm' | null {
  if (isNavidromeConfigured()) return 'navidrome'
  if (isLastFmConfigured()) return 'lastfm'
  return null
}

export async function getNowPlaying(): Promise<MusicTrack | null> {
  if (isNavidromeConfigured()) {
    const track = await getNavidromeNowPlaying()
    return track ? fromNavidrome(track) : null
  }

  if (isLastFmConfigured()) {
    const track = await getLastFmNowPlaying()
    return track ? fromLastFm(track) : null
  }

  return null
}

export async function getRecentTracks(limit = 12): Promise<MusicTrack[]> {
  if (isNavidromeConfigured()) {
    const tracks = await getNavidromeRecentTracks(limit)
    return tracks.map(fromNavidrome)
  }

  if (isLastFmConfigured()) {
    const tracks = await getLastFmRecentTracks(limit)
    return tracks.map(fromLastFm)
  }

  return []
}

export async function getListening(limit = 8): Promise<MusicListeningPayload> {
  if (isNavidromeConfigured()) {
    const payload = await getNavidromeListening(limit)
    return {
      configured: payload.configured,
      source: 'navidrome',
      nowPlaying: payload.nowPlaying ? fromNavidrome(payload.nowPlaying) : null,
      recent: payload.recent.map(fromNavidrome),
    }
  }

  if (isLastFmConfigured()) {
    const [nowPlaying, recent] = await Promise.all([
      getLastFmNowPlaying(),
      getLastFmRecentTracks(limit),
    ])

    return {
      configured: true,
      source: 'lastfm',
      nowPlaying: nowPlaying ? fromLastFm(nowPlaying) : null,
      recent: recent.filter((track) => !track.nowPlaying).map(fromLastFm),
    }
  }

  return { configured: false, source: null, nowPlaying: null, recent: [] }
}

export function getCoverArtUpstreamUrl(coverArtId: string, size = 300): string | null {
  const client = getNavidromeClient()
  if (!client) return null
  return client.getCoverArtUpstreamUrl(coverArtId, size)
}
