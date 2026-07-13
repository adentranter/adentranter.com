import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { getCategory } from '../data'
import {
  getLastFmProfileUrl,
  getNowPlaying,
  getRecentTracks,
  isLastFmConfigured,
} from '@/lib/lastfm'

export const revalidate = 60

const category = getCategory('music')!

export const metadata: Metadata = {
  title: 'Music | Distractions | Aden Tranter',
  description: category.description,
  alternates: {
    canonical: 'https://adentranter.com/distractions/music',
  },
  openGraph: {
    title: 'Music | Distractions | Aden Tranter',
    description: category.description,
    url: 'https://adentranter.com/distractions/music',
    type: 'website',
    images: [
      {
        url: '/adentranter.jpg',
        width: 1200,
        height: 630,
        alt: 'Music',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Music | Distractions | Aden Tranter',
    description: category.description,
    images: ['/adentranter.jpg'],
  },
}

function formatPlayedAt(iso: string | null): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleString('en-AU', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default async function MusicPage() {
  const configured = isLastFmConfigured()
  const [nowPlaying, recent] = configured
    ? await Promise.all([getNowPlaying(), getRecentTracks(20)])
    : [null, []]
  const profileUrl = getLastFmProfileUrl()
  const history = recent.filter((track) => !track.nowPlaying)

  return (
    <div className="max-w-3xl mx-auto py-16 px-4">
      <Link
        href="/distractions"
        className="text-sm text-gray-400 hover:text-accent-secondary transition-colors"
      >
        ← distractions
      </Link>

      <h1 className="text-3xl font-bold mt-6">{category.title}</h1>
      <p className="text-gray-400 mt-2">{category.description}</p>
      <hr className="my-8 border-t border-white/10" />

      {!configured ? (
        <p className="text-white/60 text-sm">
          Listening history isn&apos;t wired up yet. Point Navidrome (or anything else) at Last.fm
          scrobbling, then set <code className="text-white/80">LASTFM_API_KEY</code> and{' '}
          <code className="text-white/80">LASTFM_USERNAME</code>.
        </p>
      ) : (
        <div className="space-y-10">
          <section className="space-y-4">
            <h2 className="text-sm uppercase tracking-[0.18em] text-white/45">
              {nowPlaying ? 'Now playing' : 'Last played'}
            </h2>
            {(nowPlaying || history[0]) && (
              <article className="flex gap-4 rounded-xl border border-white/10 bg-accent/5 p-4">
                {(() => {
                  const track = nowPlaying || history[0]!
                  return (
                    <>
                      <div className="relative size-24 shrink-0 overflow-hidden rounded-md bg-white/5">
                        {track.imageUrl ? (
                          <Image
                            src={track.imageUrl}
                            alt={`${track.name} album art`}
                            fill
                            className="object-cover"
                            sizes="96px"
                            unoptimized
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 space-y-1">
                        {track.url ? (
                          <Link
                            href={track.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-xl font-medium text-primary hover:text-accent-secondary transition-colors"
                          >
                            {track.name}
                          </Link>
                        ) : (
                          <p className="text-xl font-medium">{track.name}</p>
                        )}
                        <p className="text-white/70">{track.artist}</p>
                        {track.album ? (
                          <p className="text-sm text-white/40">{track.album}</p>
                        ) : null}
                      </div>
                    </>
                  )
                })()}
              </article>
            )}
          </section>

          <section className="space-y-4">
            <h2 className="text-sm uppercase tracking-[0.18em] text-white/45">Recent listens</h2>
            {history.length === 0 ? (
              <p className="text-white/55 text-sm">No recent scrobbles yet.</p>
            ) : (
              <ul className="divide-y divide-white/10 rounded-xl border border-white/10 overflow-hidden">
                {history.map((track, index) => (
                  <li
                    key={`${track.name}-${track.artist}-${track.playedAt}-${index}`}
                    className="flex items-center gap-3 px-4 py-3 bg-accent/5"
                  >
                    <div className="relative size-12 shrink-0 overflow-hidden rounded bg-white/5">
                      {track.imageUrl ? (
                        <Image
                          src={track.imageUrl}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="48px"
                          unoptimized
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      {track.url ? (
                        <Link
                          href={track.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block truncate text-sm font-medium text-primary hover:text-accent-secondary transition-colors"
                        >
                          {track.name}
                        </Link>
                      ) : (
                        <p className="truncate text-sm font-medium">{track.name}</p>
                      )}
                      <p className="truncate text-xs text-white/55">{track.artist}</p>
                    </div>
                    {formatPlayedAt(track.playedAt) ? (
                      <time className="shrink-0 text-xs text-white/35" dateTime={track.playedAt!}>
                        {formatPlayedAt(track.playedAt)}
                      </time>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {profileUrl ? (
            <p className="text-sm text-white/45">
              Full history on{' '}
              <Link
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-accent-secondary transition-colors"
              >
                Last.fm
              </Link>
              .
            </p>
          ) : null}
        </div>
      )}
    </div>
  )
}
