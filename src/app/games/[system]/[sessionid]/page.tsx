import RetroClient from "@/components/retro/client"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { getRetroSystem, isRetroSystemId } from "@/lib/retro/systems"

type Props = { params: Promise<{ system: string; sessionid: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { system } = await params
  return {
    title: isRetroSystemId(system) ? `${getRetroSystem(system).name} Session` : "Games",
    robots: { index: false, follow: false },
  }
}

export default async function GameSessionPage({ params }: Props) {
  const { system, sessionid } = await params
  if (!isRetroSystemId(system)) notFound()
  return <RetroClient system={system} sessionId={sessionid} />
}
