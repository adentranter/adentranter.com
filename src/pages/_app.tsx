import '@/styles/globals.css'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Loading from './loading';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [timeLoaded, setTimeLoaded] = useState(0);


  useEffect(() => {
    const handleStart = (url: string, { shallow }: { shallow: boolean }) => {
      if (!shallow) {
        setLoading(true);
        setTimeLoaded(Date.now());
      }
    };

    const handleComplete = async() => {
      const timeSpent = Date.now() - timeLoaded;

      if (timeSpent < 400) {
        await new Promise((resolve) => setTimeout(resolve, 400 - timeSpent));
      }


      setLoading(false);
    };

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router]);

  return loading ? <Loading /> : <Component {...pageProps} />;
}