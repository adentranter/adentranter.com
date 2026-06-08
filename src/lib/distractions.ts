import fs from 'node:fs/promises'
import path from 'node:path'

import {
  distractionCategories,
  featuredPhotoPicks,
  featuredWoodworkingPicks,
  getCategory,
  type DistractionCategory,
  type DistractionPhoto,
  type DistractionSlug,
} from '@/app/distractions/data'

const featuredPicksByCategory: Partial<
  Record<DistractionSlug, Array<{ stem: string; title?: string; layout?: DistractionPhoto['layout'] }>>
> = {
  photos: featuredPhotoPicks,
  woodworking: featuredWoodworkingPicks,
}

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif'])

function fileStem(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, '')
    .replace(/_\d+_o$/i, '')
    .replace(/[-_]+$/g, '')
}

function titleFromFilename(filename: string): string {
  return fileStem(filename).replace(/[-_]+/g, ' ').trim()
}

function applyFeaturedPicks(
  photos: DistractionPhoto[],
  picks: Array<{ stem: string; title?: string; layout?: DistractionPhoto['layout'] }>
): DistractionPhoto[] {
  const byStem = new Map(photos.map((photo) => [fileStem(photo.id), photo]))

  return picks
    .map((pick) => {
      const photo = byStem.get(pick.stem)
      if (!photo) return null

      return {
        ...photo,
        ...(pick.title ? { title: pick.title, alt: pick.title } : {}),
        ...(pick.layout ? { layout: pick.layout } : {}),
      }
    })
    .filter((photo): photo is DistractionPhoto => photo !== null)
}

async function listPhotosInCategory(slug: DistractionSlug): Promise<DistractionPhoto[]> {
  const dir = path.join(process.cwd(), 'public', 'distractions', slug)

  let entries
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch {
    return []
  }

  const photos = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
      .map(async (entry) => {
        const filePath = path.join(dir, entry.name)
        const stat = await fs.stat(filePath)
        const title = titleFromFilename(entry.name)

        return {
          id: entry.name,
          category: slug,
          imagePath: `/distractions/${slug}/${entry.name}`,
          alt: title,
          title,
          date: stat.mtime.toISOString(),
        } satisfies DistractionPhoto
      })
  )

  return photos.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export async function getPhotosByCategory(slug: DistractionSlug): Promise<DistractionPhoto[]> {
  const photos = await listPhotosInCategory(slug)
  const picks = featuredPicksByCategory[slug]
  if (picks && picks.length > 0) {
    return applyFeaturedPicks(photos, picks)
  }
  return photos
}

export async function getCoverImage(slug: DistractionSlug): Promise<string | undefined> {
  const category = getCategory(slug)
  if (category?.coverImage) return category.coverImage

  const photos = await getPhotosByCategory(slug)
  return photos[0]?.imagePath
}

export async function getActiveCategories(): Promise<
  Array<DistractionCategory & { photoCount: number }>
> {
  const categories = distractionCategories
    .slice()
    .sort((a, b) => {
      if (a.status === b.status) return 0
      return a.status === 'active' ? -1 : 1
    })

  return Promise.all(
    categories.map(async (category) => ({
      ...category,
      photoCount:
        category.status === 'coming-soon'
          ? 0
          : (await getPhotosByCategory(category.slug)).length,
    }))
  )
}
