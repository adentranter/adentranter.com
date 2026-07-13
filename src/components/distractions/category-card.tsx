import Image from 'next/image'
import Link from 'next/link'

import type { DistractionCategory } from '@/app/distractions/data'

interface CategoryCardProps {
  category: DistractionCategory
  photoCount: number
  coverImage?: string
}

export function CategoryCard({ category, photoCount, coverImage }: CategoryCardProps) {
  const isComingSoon = category.status === 'coming-soon'

  return (
    <Link
      href={`/distractions/${category.slug}`}
      className={`group block rounded-xl border border-white/10 bg-accent/5 overflow-hidden transition-colors hover:border-white/20 ${
        isComingSoon ? 'opacity-60' : ''
      }`}
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-white/5">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={category.title}
            fill
            className={`object-cover transition-transform duration-300 group-hover:scale-105 ${
              category.coverImagePosition === 'top' ? 'object-top' : 'object-center'
            }`}
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-white/30 text-sm">
            {isComingSoon ? 'coming soon' : category.slug === 'music' ? '♪' : 'no photos yet'}
          </div>
        )}
        {isComingSoon && (
          <span className="absolute top-3 right-3 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/70 backdrop-blur">
            coming soon
          </span>
        )}
      </div>

      <div className="p-5">
        <h2 className="text-xl font-semibold group-hover:text-accent-secondary transition-colors">
          {category.title}
        </h2>
        <p className="text-gray-400 mt-2 text-sm">{category.description}</p>
        {!isComingSoon && photoCount > 0 && (
          <p className="text-xs text-gray-500 mt-3">
            {photoCount} {photoCount === 1 ? 'photo' : 'photos'}
          </p>
        )}
      </div>
    </Link>
  )
}
