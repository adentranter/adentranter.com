

import { Metadata } from 'next'
import { essays } from '../data'
import { notFound } from 'next/navigation'



export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const slug = (await params).slug
  const essay = essays[slug]

  if (!essay) {
    return {
      title: 'Essay Not Found',
    }
  }

  return {
    title: `${essay.title} | Aden Tranter`,
    description: essay.excerpt || 'Thoughts on software, startups, and figuring things out.',
  }
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const slug = (await params).slug
  const essay = essays[slug]
  
  if (!essay) {
    notFound()
  }

  return (
    <div className="max-w-2xl mx-auto py-16 px-4">
      <article className="prose dark:prose-invert">
        <h1>{essay.title}</h1>
        <time className="text-sm text-gray-500 block mb-8">
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
