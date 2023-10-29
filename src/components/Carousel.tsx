import Image from 'next/image'
import { useRouter } from 'next/router'
import type { ImageProps } from '../utils/types'
import SharedModal from './SharedModal'
import { createGlobalState } from 'react-hooks-global-state'

const { useGlobalState } = createGlobalState({ photoToScrollTo: 0 });

export default function Carousel({
  index,
  currentPhoto,
  prefix
}: {
  index: number
  currentPhoto: ImageProps
  prefix: string
}) {
  const router = useRouter()
  const [currentPhotoId, setcurrentPhotoId] = useGlobalState('photoToScrollTo');


  function closeModal() {
    setcurrentPhotoId(currentPhoto.id);
    router.push('/'+prefix, undefined, { shallow: true });
  }

  function changePhotoId(newVal: number) {
    return newVal
  }


  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <button
        className="absolute inset-0 z-30 cursor-default bg-black backdrop-blur-2xl"
        onClick={closeModal}
      >
        ({currentPhoto.blurDataUrl &&
         <Image
         src={currentPhoto.blurDataUrl}
         className="pointer-events-none h-full w-full"
         alt="blurred background"
         fill
         priority={true}
       />  
        })
       
      </button>
      <SharedModal
        index={index}
        changePhotoId={changePhotoId}
        currentPhoto={currentPhoto}
        closeModal={closeModal}
        navigation={false}
      />
    </div>
  )
}