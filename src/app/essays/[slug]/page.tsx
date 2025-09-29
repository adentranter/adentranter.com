import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import { promises as fs } from 'fs'
import path from 'path'

import { essays, type EssayMeta } from '../data'

async function loadEssay(slug: string): Promise<{ meta: EssayMeta; content: string } | null> {
  const meta = essays[slug]
  if (!meta) {
    return null
  }

  const filePath = path.join(process.cwd(), meta.contentPath)
  const content = await fs.readFile(filePath, 'utf8')

  return { meta, content }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const essay = essays[slug]

  if (!essay) {
    return {
      title: 'Essay Not Found | Aden Tranter',
      description: 'The requested essay could not be found.',
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
  const { slug } = await params
  const loadedEssay = await loadEssay(slug)

  if (!loadedEssay) {
    notFound()
  }

  const { meta: essay, content } = loadedEssay

  return (
    <div className="max-w-2xl mx-auto py-16 px-4">
      <article className="prose dark:prose-invert max-w-none">
        <h1 className="text-3xl font-bold mb-4">{essay.title}</h1>
        <time className="text-sm text-gray-500 block mb-8 text-left">
          {new Date(`${essay.date}T00:00:00Z`).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'UTC',
          })}
        </time>
        <div>
          <ReactMarkdown
            components={{
              ol: ({ node, ...props }) => (
                <ol
                  className="list-decimal pl-6 my-6 space-y-2 [&_ol]:mt-2 [&_ul]:mt-2"
                  {...props}
                />
              ),
              blockquote: ({ node, ...props }) => (
                <blockquote
                  className="border-l-2 border-white/20 pl-4 my-8 space-y-4 text-base italic"
                  {...props}
                />
              ),
              ul: ({ node, ordered, ...props }) => (
                <ul
                  className="list-disc pl-6 my-6 space-y-2 [&_blockquote]:my-4"
                  {...props}
                />
              ),
              li: ({ node, ...props }) => (
                <li className="mb-2 leading-relaxed" {...props} />
              ),
              h2: ({ node, ...props }) => (
                <h2 className="text-2xl font-semibold mt-10 mb-6" {...props} />
              ),
              strong: ({ node, ...props }) => (
                <strong className="font-semibold" {...props} />
              ),
              p: ({ node, ...props }) => (
                <p className="my-6 leading-relaxed" {...props} />
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </article>
    </div>
  )
}
