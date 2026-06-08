'use client'

import { useCallback, useEffect, useState } from 'react'
import { X } from 'lucide-react'

import type { DistractionPhoto } from '@/app/distractions/data'

interface PhotoGridProps {
  photos: DistractionPhoto[]
  emptyMessage?: string
}

function PhotoTile({
  photo,
  onSelect,
  className = '',
}: {
  photo: DistractionPhoto
  onSelect: (photo: DistractionPhoto) => void
  className?: string
}) {
  const isFeaturedBottom = photo.layout === 'featured-bottom'
  const isLarge = photo.layout === 'large'

  return (
    <button
      type="button"
      onClick={() => onSelect(photo)}
      className={`group flex w-full flex-col text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.imagePath}
        alt={photo.alt}
        loading="lazy"
        className="h-auto w-full border-2 border-white/50 bg-white/5 transition-colors group-hover:border-white/70"
      />
      {photo.title && (
        <p
          className={`mt-3 font-medium text-white/80 transition-colors group-hover:text-accent-secondary ${
            isFeaturedBottom || isLarge ? 'text-center text-base' : 'text-sm'
          }`}
        >
          {photo.title}
        </p>
      )}
    </button>
  )
}

function splitBalancedColumns(
  leftAnchor: DistractionPhoto[],
  columnPhotos: DistractionPhoto[]
): [DistractionPhoto[], DistractionPhoto[]] {
  const leftColumn = [...leftAnchor]
  const rightColumn: DistractionPhoto[] = []

  columnPhotos.forEach((photo, index) => {
    if (index % 2 === 0) {
      rightColumn.push(photo)
    } else {
      leftColumn.push(photo)
    }
  })

  return [leftColumn, rightColumn]
}

export function PhotoGrid({
  photos,
  emptyMessage = 'No photos yet — check back soon.',
}: PhotoGridProps) {
  const [activePhoto, setActivePhoto] = useState<DistractionPhoto | null>(null)

  const closeLightbox = useCallback(() => setActivePhoto(null), [])

  useEffect(() => {
    if (!activePhoto) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeLightbox()
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [activePhoto, closeLightbox])

  if (photos.length === 0) {
    return (
      <p className="text-gray-400 text-center py-12">{emptyMessage}</p>
    )
  }

  const leftAnchor = photos.filter((photo) => photo.layout === 'featured-left')
  const bottomPhotos = photos.filter((photo) => photo.layout === 'featured-bottom')
  const gridPhotos = photos.filter(
    (photo) => photo.layout !== 'featured-bottom' && photo.layout !== 'featured-left'
  )
  const largePhotos = gridPhotos.filter((photo) => photo.layout === 'large')
  const columnPhotos = gridPhotos.filter((photo) => photo.layout !== 'large')
  const useBalancedColumns = leftAnchor.length > 0

  const [leftColumn, rightColumn] = useBalancedColumns
    ? splitBalancedColumns(leftAnchor, columnPhotos)
    : [[], columnPhotos]

  return (
    <>
      {useBalancedColumns ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-10 items-start">
          <div className="flex flex-col gap-10">
            {leftColumn.map((photo) => (
              <PhotoTile key={photo.id} photo={photo} onSelect={setActivePhoto} />
            ))}
          </div>

          <div className="flex flex-col gap-10">
            {rightColumn.map((photo) => (
              <PhotoTile key={photo.id} photo={photo} onSelect={setActivePhoto} />
            ))}
          </div>
        </div>
      ) : (
        <div className="columns-1 md:columns-2 gap-10 [column-fill:balance]">
          {gridPhotos.map((photo) => (
            <div
              key={photo.id}
              className={`mb-10 break-inside-avoid ${photo.layout === 'large' ? '[column-span:all]' : ''}`}
            >
              <PhotoTile photo={photo} onSelect={setActivePhoto} />
            </div>
          ))}
        </div>
      )}

      {largePhotos.length > 0 && (
        <div className={`${useBalancedColumns ? 'mt-14' : ''} flex flex-col items-center gap-10`}>
          {largePhotos.map((photo) => (
            <div key={photo.id} className="w-full">
              <PhotoTile photo={photo} onSelect={setActivePhoto} className="items-center" />
            </div>
          ))}
        </div>
      )}

      {bottomPhotos.length > 0 && (
        <div className="mt-14 flex flex-col items-center gap-12">
          {bottomPhotos.map((photo) => (
            <div key={photo.id} className="w-full max-w-2xl md:max-w-4xl">
              <PhotoTile photo={photo} onSelect={setActivePhoto} className="items-center" />
            </div>
          ))}
        </div>
      )}

      {activePhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label={activePhoto.title || activePhoto.alt}
        >
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 text-white/70 transition-colors hover:text-white hover:bg-white/10"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>

          <div
            className="relative max-h-[90vh] max-w-6xl w-full flex flex-col items-center"
            onClick={(event) => event.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activePhoto.imagePath}
              alt={activePhoto.alt}
              className="max-h-[85vh] w-auto max-w-full object-contain"
            />
            {activePhoto.title && (
              <p className="text-lg font-medium text-white mt-4 text-center max-w-lg">
                {activePhoto.title}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
