import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { connection } from "next/server"
import { randomUUID } from "crypto"

import { getRetroSystem, isRetroSystemId } from "@/lib/retro/systems"

type Props = { params: Promise<{ system: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { system } = await params
  return {
    title: isRetroSystemId(system) ? getRetroSystem(system).name : "Games",
    robots: { index: false, follow: false },
  }
}

export default async function GameSystemPage({ params }: Props) {
  const { system } = await params
  if (!isRetroSystemId(system)) notFound()
  // Without this the redirect is prerendered and every visitor shares one session id
  await connection()
  redirect(`/games/${system}/${encodeURIComponent(randomUUID())}`)
}
