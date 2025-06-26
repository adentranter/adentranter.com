import { Metadata } from 'next'
import { essays } from '../data'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'

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
    alternates: {
      canonical: `https://adentranter.com/essays/${slug}`,
    },
    openGraph: {
      title: `${essay.title} | Aden Tranter`,
      description: essay.excerpt || 'Thoughts on software, startups, and figuring things out.',
      type: 'article',
      url: `https://adentranter.com/essays/${slug}`,
      publishedTime: new Date(essay.date).toISOString(),
      authors: ['Aden Tranter'],
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
      title: `${essay.title} | Aden Tranter`,
      description: essay.excerpt || 'Thoughts on software, startups, and figuring things out.',
      images: ['/adentranter.jpg'],
    },
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
      <article className="prose dark:prose-invert max-w-none">
        <h1 className="text-3xl font-bold mb-4">{essay.title}</h1>
        <time className="text-sm text-gray-500 block mb-8 text-left">
          {new Date(essay.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </time>
        <div>
          <ReactMarkdown
            components={{
              ul: ({node, ...props}) => (
                <ul className="list-disc pl-6 my-6 space-y-2" {...props} />
              ),
              li: ({node, ...props}) => (
                <li className="mb-2" {...props} />
              ),
              h2: ({node, ...props}) => (
                <h2 className="text-2xl font-semibold mt-10 mb-6" {...props} />
              ),
              strong: ({node, ...props}) => (
                <strong className="font-semibold" {...props} />
              ),
              p: ({node, ...props}) => (
                <p className="my-6 leading-relaxed" {...props} />
              )
            }}
          >
            {essay.content}
          </ReactMarkdown>
        </div>
      </article>
    </div>
  )
}
