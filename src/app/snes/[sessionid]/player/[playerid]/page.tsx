import SnesController from '@/components/snes/controller'
import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'SNES Controller',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default async function Page({ params }: any) {
  const { sessionid, playerid } = await params
  return <SnesController sessionId={sessionid} playerId={playerid} />
}
