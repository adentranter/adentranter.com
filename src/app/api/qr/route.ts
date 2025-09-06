import type { NextRequest } from 'next/server'
import QRCode from 'qrcode'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const text = searchParams.get('text') || ''
  const sizeParam = searchParams.get('size')
  const size = Math.max(64, Math.min(1024, Number(sizeParam) || 180))
  if (!text) return new Response('Missing `text`', { status: 400 })

  try {
    const svg = await QRCode.toString(text, {
      type: 'svg',
      width: size,
      margin: 0,
      errorCorrectionLevel: 'M',
    })
    return new Response(svg, {
      headers: {
        'content-type': 'image/svg+xml; charset=utf-8',
        'cache-control': 'no-store',
      },
    })
  } catch (e: any) {
    return new Response('Failed to generate QR', { status: 500 })
  }
}

