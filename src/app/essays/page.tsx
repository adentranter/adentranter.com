import Link from 'next/link'
import { essays, Essay } from './data'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Essays | Aden Tranter',
  description: 'Thoughts on software, startups, and figuring things out.',
}

export default async function EssaysPage() {
  return (
    <div className="max-w-2xl mx-auto py-16 px-4">
      <h1 className="text-3xl font-bold mb-8">Essays</h1>
      <p className="text-gray-400 mb-8">
        Thoughts on software, startups, and the journey of building things.
      </p>
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
                  {new Date(essay.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
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
