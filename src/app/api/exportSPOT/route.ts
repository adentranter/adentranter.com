import { NextResponse } from 'next/server'
import {
  getUserProfile,
  getAllPlaylists,
  getPlaylistTracks,
  getAllLikedTracks,
  getAllFollowedArtists,
} from '@/lib/spotify'

// Represents a single track
export interface SpotifyTrack {
  id: string                 // Spotify track ID
  name: string               // Track name
  artists: string[]          // Artist names
  album: string              // Album name
  albumId?: string           // Optional album ID
  durationMs: number         // Duration in milliseconds
  spotifyUrl: string         // Spotify track URL
  previewUrl?: string        // Optional 30s preview URL
  addedAt?: string           // ISO date string when added to playlist
  explicit: boolean          // Explicit content flag
  trackNumber?: number       // Track number in album
  discNumber?: number        // Disc number
  genres?: string[]          // Optional genres if available
}

// Represents a playlist
export interface SpotifyPlaylist {
  id: string                 // Spotify playlist ID
  name: string               // Playlist name
  description?: string       // Optional description
  owner: string              // Owner username
  public: boolean            // Is it public
  collaborative: boolean     // Collaborative flag
  snapshotId?: string        // Snapshot ID for versioning
  tracks: SpotifyTrack[]     // Tracks in the playlist
  images?: string[]          // URLs to playlist images
  createdAt?: string         // Optional creation date
}

// Represents a followed artist
export interface SpotifyArtist {
  id: string                 // Artist ID
  name: string               // Artist name
  genres?: string[]          // Genres
  images?: string[]          // Artist images
  spotifyUrl: string         // Spotify artist URL
}

// Represents the top-level export
export interface SpotifyExport {
  userId: string                // Spotify user ID
  userName?: string             // Optional display name
  exportDate: string            // ISO string of export date
  playlists: SpotifyPlaylist[]  // All playlists
  likedTracks?: SpotifyTrack[]  // Optional separate liked songs
  followedArtists?: SpotifyArtist[] // Optional followed artists
}

/**
 * Transform Spotify track item to SpotifyTrack
 * Works for both playlist tracks and saved tracks
 */
function transformTrack(item: any): SpotifyTrack {
  const track = item.track
  return {
    id: track.id,
    name: track.name,
    artists: track.artists.map((a: any) => a.name),
    album: track.album.name,
    albumId: track.album.id,
    durationMs: track.duration_ms,
    spotifyUrl: track.external_urls.spotify,
    previewUrl: track.preview_url || undefined,
    addedAt: item.added_at || undefined,
    explicit: track.explicit,
    trackNumber: track.track_number || undefined,
    discNumber: track.disc_number || undefined,
    genres: undefined, // Genres not available at track level
  }
}

/**
 * Transform Spotify playlist to SpotifyPlaylist
 */
async function transformPlaylist(playlist: any): Promise<SpotifyPlaylist> {
  // Fetch all tracks for this playlist
  const playlistTracks = await getPlaylistTracks(playlist.id)
  const tracks = playlistTracks.map(transformTrack)

  return {
    id: playlist.id,
    name: playlist.name,
    description: playlist.description || undefined,
    owner: playlist.owner.display_name || playlist.owner.id,
    public: playlist.public,
    collaborative: playlist.collaborative,
    snapshotId: playlist.snapshot_id || undefined,
    tracks,
    images: playlist.images?.map((img: any) => img.url) || undefined,
    createdAt: playlist.created_at || undefined,
  }
}

/**
 * Transform Spotify artist to SpotifyArtist
 */
function transformArtist(artist: any): SpotifyArtist {
  return {
    id: artist.id,
    name: artist.name,
    genres: artist.genres || undefined,
    images: artist.images?.map((img: any) => img.url) || undefined,
    spotifyUrl: artist.external_urls.spotify,
  }
}

export async function GET() {
  try {
    console.log('Starting Spotify export...')

    // Fetch user profile
    console.log('Fetching user profile...')
    const userProfile = await getUserProfile()

    // Fetch all playlists
    console.log('Fetching all playlists...')
    const playlists = await getAllPlaylists()
    console.log(`Found ${playlists.length} playlists`)

    // Transform playlists (this will fetch tracks for each)
    console.log('Fetching tracks for playlists...')
    const transformedPlaylists: SpotifyPlaylist[] = []
    for (let i = 0; i < playlists.length; i++) {
      const playlist = playlists[i]
      console.log(`Processing playlist ${i + 1}/${playlists.length}: ${playlist.name}`)
      try {
        const transformed = await transformPlaylist(playlist)
        transformedPlaylists.push(transformed)
      } catch (error) {
        console.error(`Error processing playlist ${playlist.name}:`, error)
        // Continue with other playlists even if one fails
      }
    }

    // Fetch all liked tracks
    console.log('Fetching liked tracks...')
    const likedTracks = await getAllLikedTracks()
    console.log(`Found ${likedTracks.length} liked tracks`)
    const transformedLikedTracks = likedTracks.map(transformTrack)

    // Fetch all followed artists
    console.log('Fetching followed artists...')
    const followedArtists = await getAllFollowedArtists()
    console.log(`Found ${followedArtists.length} followed artists`)
    const transformedArtists = followedArtists.map(transformArtist)

    // Build export object
    const exportData: SpotifyExport = {
      userId: userProfile.id,
      userName: userProfile.display_name || undefined,
      exportDate: new Date().toISOString(),
      playlists: transformedPlaylists,
      likedTracks: transformedLikedTracks,
      followedArtists: transformedArtists,
    }

    console.log('Export complete!')

    // Return JSON with download headers
    const filename = `spotify-export-${new Date().toISOString().split('T')[0]}.json`
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error during Spotify export:', error)
    return NextResponse.json(
      { error: 'Failed to export Spotify data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
