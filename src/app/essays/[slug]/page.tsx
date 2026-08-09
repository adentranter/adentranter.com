import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'

import { EssayComments } from '@/components/essay-comments'
import { JsonLd } from '@/components/json-ld'
import { getEssayBySlug } from '@/lib/essays'
import { SITE_OG_IMAGE, articleJsonLd } from '@/lib/site'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const essay = await getEssayBySlug(slug)

  if (!essay) {
    return {
      title: 'Essay Not Found',
      description: 'The requested essay could not be found.',
      robots: { index: false, follow: false },
    }
  }

  const description = essay.excerpt || 'Thoughts on software, startups, and figuring things out.'
  const title = essay.title
  const path = `/essays/${slug}`

  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    robots: essay.listed ? undefined : { index: false, follow: false },
    openGraph: {
      title: `${title} | Aden Tranter`,
      description,
      type: 'article',
      url: path,
      publishedTime: new Date(essay.date).toISOString(),
      authors: ['Aden Tranter'],
      images: [SITE_OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Aden Tranter`,
      description,
      images: [SITE_OG_IMAGE.url],
    },
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const essay = await getEssayBySlug(slug)

  if (!essay) {
    notFound()
  }

  const description = essay.excerpt || 'Thoughts on software, startups, and figuring things out.'
  const publishedTime = new Date(essay.date).toISOString()

  return (
    <div className="max-w-2xl mx-auto py-16 px-4">
      {essay.listed && (
        <JsonLd
          data={articleJsonLd({
            title: essay.title,
            description,
            path: `/essays/${essay.slug}`,
            datePublished: publishedTime,
          })}
        />
      )}
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
              ul: ({ node, ...props }) => (
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
            {essay.body}
          </ReactMarkdown>
        </div>
      </article>

      <EssayComments slug={essay.slug} />
    </div>
  )
}
