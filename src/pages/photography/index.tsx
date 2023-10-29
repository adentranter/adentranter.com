import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useRef } from 'react'
import Bridge from '../../components/Icons/Bridge'
import Modal from '../../components/Modal'
import cloudinary from '../../utils/cloudinary'
import getBase64ImageUrl from '../../utils/generateBlurPlaceholder'
import type { ImageProps } from '../../utils/types'


import TopTopNav from '@/components/TopTopNav'
import { createGlobalState } from 'react-hooks-global-state'

const { useGlobalState } = createGlobalState({ photoToScrollTo: 0 });


const Home: NextPage<{ images: ImageProps[] }> = ({ images }) => {
  const router = useRouter()
  const { photoId } = router.query
  const [lastViewedPhoto, setLastViewedPhoto] = useGlobalState("photoToScrollTo");

  const lastViewedPhotoRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    // This effect keeps track of the last viewed photo in the modal to keep the index page in sync when the user navigates back
    if (lastViewedPhoto && !photoId) {
      lastViewedPhotoRef?.current?.scrollIntoView({ block: 'center' })
      setLastViewedPhoto(0)
    }
  }, [photoId, lastViewedPhoto, setLastViewedPhoto])

  return (
    <>
 <Head>
        <title>Aden Tranter | Photography</title>

      </Head>    
     
 
      <TopTopNav />
      <main className="container mx-auto mt-5 p-4">
        <div className="flex items-center min-h-50">
          <div className="w-full">
            <h1 className="text-2xl font-bold">Aden Tranter</h1>
            <div className=" font-extralight"><Link href="/programming">Programmer</Link>, <Link href="/programming">Problem Solver</Link>, <Link href="/photography">Photographer</Link>, <Link href="/furniture">Creator</Link></div>
          </div>
        </div>
        <div className='w-full mt-10 h-1 bg-white-200'></div>
      
        {photoId && (
          <Modal
            prefix="photography"
            images={images}
            onClose={() => {
              setLastViewedPhoto(Number(photoId))
            }}
          />
        )}
        <div className="columns-1 gap-4 sm:columns-2 xl:columns-3 2xl:columns-4">
     
          {images.map(({ id, public_id, format, blurDataUrl }) => (
            <Link
              key={id}
              href={`/photography/?photoId=${id}`}
              as={`/photography/${id}`}
              ref={id === Number(lastViewedPhoto) ? lastViewedPhotoRef : null}
              shallow
              className="after:content group relative mb-5 block w-full cursor-zoom-in after:pointer-events-none after:absolute after:inset-0 after:rounded-lg "
            >
              <Image
                alt="Next.js Conf photo"
                className="transform rounded-lg brightness-90 transition will-change-auto group-hover:brightness-110 "
                style={{ transform: 'translate3d(0, 0, 0)' }}
                placeholder="blur"
                blurDataURL={blurDataUrl}
                src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/c_scale,w_720/${public_id}.${format}`}
                width={720}
                height={480}
                sizes="(max-width: 640px) 100vw,
                  (max-width: 1280px) 50vw,
                  (max-width: 1536px) 33vw,
                  25vw"
              />
            </Link>
          ))}
        </div>
      </main>
      <footer className="p-6 text-center text-white/80 sm:p-12">
       
      </footer>
    </>
  )
}

export default Home

export async function getStaticProps() {
  const results = await cloudinary.v2.search
    .expression(`folder:${process.env.CLOUDINARY_FOLDER}/photography/*`)
    .sort_by('public_id', 'desc')
    .max_results(400)
    .execute()
  let reducedResults: ImageProps[] = []

  let i = 0
  for (let result of results.resources) {
    reducedResults.push({
      id: i,
      height: result.height,
      width: result.width,
      public_id: result.public_id,
      format: result.format,
    })
    i++
  }

  const blurImagePromises = results.resources.map((image: ImageProps) => {
    return getBase64ImageUrl(image)
  })
  const imagesWithBlurDataUrls = await Promise.all(blurImagePromises)

  for (let i = 0; i < reducedResults.length; i++) {
    reducedResults[i].blurDataUrl = imagesWithBlurDataUrls[i]
  }

  return {
    props: {
      images: reducedResults,
    },
  }
}