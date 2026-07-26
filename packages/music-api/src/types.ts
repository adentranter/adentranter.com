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

export type MusicApiConfig = {
  /** Navidrome base URL, e.g. https://media.adentranter.com */
  baseUrl: string
  username: string
  password: string
  /**
   * Optional absolute origin used when building cover proxy URLs for clients.
   * Example: https://adentranter.com
   */
  siteOrigin?: string
  /** Subsonic client name reported to Navidrome. */
  clientName?: string
}

export type MusicListeningPayload = {
  configured: boolean
  nowPlaying: MusicTrack | null
  recent: MusicTrack[]
}
