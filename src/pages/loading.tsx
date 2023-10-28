

  import TopTopNav from '../components/TopTopNav';
import Link from 'next/link';

export default function Loading() {
  // You can add any UI inside Loading, including a Skeleton.
  return (
    <>
    <TopTopNav/>
    <div className='color-white h-screen flex items-center justify-center'>
    Loading....
    </div>
    </>
  )
}


