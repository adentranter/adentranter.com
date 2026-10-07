import N64Controller from '@/components/retro/n64-controller'
import Ps1Controller from '@/components/retro/ps1-controller'
import SnesController, { NdsController } from '@/components/retro/snes-controller'
import type { Metadata, Viewport } from 'next'
import type { ComponentType } from 'react'
import { notFound } from 'next/navigation'

import { getRetroSystem, isRetroSystemId, type RetroSystemId } from '@/lib/retro/systems'

type Props = { params: Promise<{ system: string; sessionid: string; playerid: string }> }

const CONTROLLERS: Record<RetroSystemId, ComponentType<{ sessionId: string; playerId: string }>> = {
  snes: SnesController,
  n64: N64Controller,
  ps1: Ps1Controller,
  nds: NdsController,
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { system } = await params
  return {
    title: isRetroSystemId(system) ? `${getRetroSystem(system).name} Controller` : 'Controller',
    robots: { index: false, follow: false },
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default async function Page({ params }: Props) {
  const { system, sessionid, playerid } = await params
  if (!isRetroSystemId(system)) notFound()
  const Controller = CONTROLLERS[system]
  return <Controller sessionId={sessionid} playerId={playerid} />
}
