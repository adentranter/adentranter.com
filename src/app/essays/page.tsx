import Link from 'next/link'
import { essays, Essay } from './data'

export default async function EssaysPage() {
  return (
    <div className="max-w-2xl mx-auto py-16 px-4">
      
      <h1 className="text-3xl font-bold mb-8">Essays</h1>
      <hr className="my-8 border-t border-white/10" />

      <div className="space-y-8">
        {Object.values(essays).map((essay: Essay) => (
          <article key={essay.slug} className="border-b border-gray-200 pb-8">
            <Link 
              href={`/essays/${essay.slug}`}
              className="block group"
            >
              <h2 className="text-xl font-semibold group-hover:text-accent-secondary transition-colors">
                {essay.title}
              </h2>
              <time className="text-sm text-gray-500 mt-2 block">
                {new Date(essay.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </time>
            </Link>
          </article>
        ))}
      </div>
    </div>
  )
}
