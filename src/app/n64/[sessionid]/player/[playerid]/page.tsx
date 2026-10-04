import N64Controller from '@/components/retro/n64-controller'
import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'N64 Controller',
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
  return <N64Controller sessionId={sessionid} playerId={playerid} />
}
