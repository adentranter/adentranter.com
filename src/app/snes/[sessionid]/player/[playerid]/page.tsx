import SnesController from '@/components/snes/controller'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SNES Controller',
  robots: { index: false, follow: false },
}

export default async function Page({ params }: { params: Promise<{ sessionid: string; playerid: string }> }) {
  const { sessionid, playerid } = await params
  return <SnesController sessionId={sessionid} playerId={playerid} />
}
