import Link from 'next/link'
import { essays, Essay } from './data'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Essays | Aden Tranter',
  description: 'Thoughts on software, startups, and figuring things out.',
  alternates: {
    canonical: 'https://adentranter.com/essays',
  },
  openGraph: {
    title: 'Essays | Aden Tranter',
    description: 'Thoughts on software, startups, and figuring things out.',
    url: 'https://adentranter.com/essays',
    type: 'website',
    images: [
      {
        url: '/adentranter.jpg',
        width: 1200,
        height: 630,
        alt: 'Aden Tranter',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Essays | Aden Tranter',
    description: 'Thoughts on software, startups, and figuring things out.',
    images: ['/adentranter.jpg'],
  },
}

export default async function EssaysPage() {
  return (
    <div className="max-w-2xl mx-auto py-16 px-4">
      <h1 className="text-3xl font-bold mb-8">Essays</h1>
      <hr className="my-8 border-t border-white/10" />

      <div className="space-y-8">
        {Object.values(essays)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .map((essay: Essay) => (
            <article key={essay.slug} className="border-b border-white/10 pb-8">
              <Link 
                href={`/essays/${essay.slug}`}
                className="block group"
              >
                <h2 className="text-xl font-semibold group-hover:text-accent-secondary transition-colors">
                  {essay.title}
                </h2>
                <time className="text-sm text-gray-400 mt-2 block">
                  {new Date(`${essay.date}T00:00:00Z`).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    timeZone: 'UTC'
                  })}
                </time>
                {essay.excerpt && (
                  <p className="text-gray-400 mt-2">{essay.excerpt}</p>
                )}
              </Link>
            </article>
          ))}
      </div>
    </div>
  )
}
