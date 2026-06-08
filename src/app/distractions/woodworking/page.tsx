import { Metadata } from 'next'
import Link from 'next/link'

export const revalidate = 3600

import { PhotoGrid } from '@/components/distractions/photo-grid'
import { getCategory } from '../data'
import { getCoverImage, getPhotosByCategory } from '@/lib/distractions'

const category = getCategory('woodworking')!

export async function generateMetadata(): Promise<Metadata> {
  const coverImage = (await getCoverImage('woodworking')) || '/adentranter.jpg'

  return {
    title: 'Woodworking | Distractions | Aden Tranter',
    description: category.description,
    alternates: {
      canonical: 'https://adentranter.com/distractions/woodworking',
    },
    openGraph: {
      title: 'Woodworking | Distractions | Aden Tranter',
      description: category.description,
      url: 'https://adentranter.com/distractions/woodworking',
      type: 'website',
      images: [
        {
          url: coverImage,
          width: 1200,
          height: 630,
          alt: 'Woodworking',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Woodworking | Distractions | Aden Tranter',
      description: category.description,
      images: [coverImage],
    },
  }
}

export default async function WoodworkingPage() {
  const photos = await getPhotosByCategory('woodworking')

  return (
    <div className="max-w-6xl mx-auto py-16 px-4">
      <Link
        href="/distractions"
        className="text-sm text-gray-400 hover:text-accent-secondary transition-colors"
      >
        ← distractions
      </Link>

      <h1 className="text-3xl font-bold mt-6">{category.title}</h1>
      <p className="text-gray-400 mt-2">{category.description}</p>
      <hr className="my-8 border-t border-white/10" />

      <PhotoGrid photos={photos} />
    </div>
  )
}
