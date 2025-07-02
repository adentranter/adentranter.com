import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { SpotifyAPIClient } from "@/lib/spotify"

const schema = z.object({ ids: z.string().min(1) })

// Runtime: default (node)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const ids = searchParams.get("ids")

  const parse = schema.safeParse({ ids })
  if (!parse.success) {
    return NextResponse.json({ error: "Missing ids" }, { status: 400 })
  }

  try {
    const client = SpotifyAPIClient.getInstance() as any
    const data: any = await client.fetchSpotifyApi(
      `/tracks?ids=${encodeURIComponent(ids!)}`
    )

    const simplified = data.tracks.map((t: any) => ({
      id: t.id,
      name: t.name,
      artists: t.artists.map((a: any) => a.name).join(", "),
      image: t.album.images[0]?.url || null,
    }))

    return NextResponse.json({ items: simplified })
  } catch (err) {
    console.error("Spotify tracks fetch error", err)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
} 