import { NextRequest, NextResponse } from 'next/server'

import { getCoverArtUpstreamUrl } from '@/lib/music'
import { isNavidromeConfigured } from '@adentranter/music-api'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  if (!isNavidromeConfigured()) {
    return new NextResponse('Navidrome is not configured', { status: 404 })
  }

  const id = request.nextUrl.searchParams.get('id')?.trim()
  if (!id) {
    return new NextResponse('Missing cover art id', { status: 400 })
  }

  const sizeParam = request.nextUrl.searchParams.get('size')
  const size = sizeParam ? Number(sizeParam) : 300
  const upstream = getCoverArtUpstreamUrl(id, Number.isFinite(size) ? size : 300)
  if (!upstream) {
    return new NextResponse('Cover art unavailable', { status: 404 })
  }

  try {
    const response = await fetch(upstream, { cache: 'force-cache' })
    if (!response.ok) {
      return new NextResponse('Failed to fetch cover art', { status: response.status })
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const bytes = await response.arrayBuffer()

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    })
  } catch (error) {
    console.error('Failed to proxy Navidrome cover art:', error)
    return new NextResponse('Cover art proxy failed', { status: 502 })
  }
}
