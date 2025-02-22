import { essays } from '../data'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'

type Props = {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const essay = essays[params.slug]
  
  if (!essay) {
    return {
      title: 'Essay Not Found'
    }
  }

  return {
    title: `${essay.title} | Aden Tranter`,
    description: essay.excerpt || essay.title,
  }
}

export default async function EssayPage({ params }: Props) {
  const essay = essays[params.slug]
  
  if (!essay) {
    notFound()
  }

  return (
    <div className="max-w-2xl mx-auto py-16 px-4">
      <Link 
        href="/essays"
        className="text-gray-400 hover:text-accent-secondary transition-colors mb-8 inline-block"
      >
        ← Back to Essays
      </Link>
      
      <article className="prose dark:prose-invert">
        <h1>{essay.title}</h1>
        <time className="text-sm text-gray-400 block mb-8">
          {new Date(essay.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </time>
        <div className="whitespace-pre-wrap">
          {essay.content}
        </div>
      </article>
    </div>
  )
}
