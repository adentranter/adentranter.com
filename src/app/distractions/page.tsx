import { Metadata } from 'next'

import { CategoryCard } from '@/components/distractions/category-card'

export const revalidate = 3600
import { getActiveCategories, getCoverImage } from '@/lib/distractions'

export const metadata: Metadata = {
  title: 'Distractions | Aden Tranter',
  description: 'Hobbies and side projects — photos, woodworking, and more.',
  alternates: {
    canonical: 'https://adentranter.com/distractions',
  },
  openGraph: {
    title: 'Distractions | Aden Tranter',
    description: 'Hobbies and side projects — photos, woodworking, and more.',
    url: 'https://adentranter.com/distractions',
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
    title: 'Distractions | Aden Tranter',
    description: 'Hobbies and side projects — photos, woodworking, and more.',
    images: ['/adentranter.jpg'],
  },
}

export default async function DistractionsPage() {
  const categories = await getActiveCategories()

  const categoriesWithCovers = await Promise.all(
    categories.map(async (category) => ({
      ...category,
      coverImage: await getCoverImage(category.slug),
    }))
  )

  return (
    <div className="max-w-4xl mx-auto py-16 px-4">
      <h1 className="text-3xl font-bold">distractions</h1>
      <p className="text-gray-400 mt-2">or overlapping venn diagrams</p>
      <hr className="my-8 border-t border-white/10" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categoriesWithCovers.map((category) => (
          <CategoryCard
            key={category.slug}
            category={category}
            photoCount={category.photoCount}
            coverImage={category.coverImage}
          />
        ))}
      </div>
    </div>
  )
}
