import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { SpotifyAPIClient } from "@/lib/spotify"

const querySchema = z.object({ q: z.string().min(1) })

// Runtime: default (node)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q")

  const parse = querySchema.safeParse({ q })
  if (!parse.success) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 })
  }

  try {
    const client = SpotifyAPIClient.getInstance() as any
    const data: any = await client.fetchSpotifyApi(
      `/search?type=track&limit=10&q=${encodeURIComponent(q!)}`
    )

    // Return only necessary fields to keep payload small
    const simplified = data.tracks.items.map((t) => ({
      id: t.id,
      name: t.name,
      artists: t.artists.map((a: { name: string }) => a.name).join(", "),
      image: t.album.images[0]?.url || null,
    }))

    return NextResponse.json({ items: simplified })
  } catch (err: any) {
    console.error("Spotify search error", err)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
} 