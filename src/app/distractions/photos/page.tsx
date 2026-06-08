import { Metadata } from 'next'
import Link from 'next/link'

export const revalidate = 3600

import { PhotoGrid } from '@/components/distractions/photo-grid'
import { FLICKR_PHOTOS_URL, getCategory } from '../data'
import { getCoverImage, getPhotosByCategory } from '@/lib/distractions'

const category = getCategory('photos')!

export async function generateMetadata(): Promise<Metadata> {
  const coverImage = (await getCoverImage('photos')) || '/adentranter.jpg'

  return {
    title: 'My Photos | Distractions | Aden Tranter',
    description: category.description,
    alternates: {
      canonical: 'https://adentranter.com/distractions/photos',
    },
    openGraph: {
      title: 'My Photos | Distractions | Aden Tranter',
      description: category.description,
      url: 'https://adentranter.com/distractions/photos',
      type: 'website',
      images: [
        {
          url: coverImage,
          width: 1200,
          height: 630,
          alt: 'My Photos',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'My Photos | Distractions | Aden Tranter',
      description: category.description,
      images: [coverImage],
    },
  }
}

export default async function PhotosPage() {
  const photos = await getPhotosByCategory('photos')

  return (
    <div className="max-w-7xl mx-auto py-16 px-6 md:px-10">
      <Link
        href="/distractions"
        className="text-sm text-gray-400 hover:text-accent-secondary transition-colors"
      >
        ← distractions
      </Link>

      <h1 className="text-3xl font-bold mt-6">{category.title}</h1>
      <p className="text-gray-400 mt-2">{category.description}</p>
      <p className="text-gray-400 mt-4 text-sm">
        A small selection here.{' '}
        <Link
          href={FLICKR_PHOTOS_URL}
          target="_blank"
          rel="noreferrer"
          className="text-white/70 hover:text-accent-secondary transition-colors underline underline-offset-4"
        >
          More on Flickr →
        </Link>
      </p>
      <hr className="my-8 border-t border-white/10" />

      <PhotoGrid photos={photos} />
    </div>
  )
}
