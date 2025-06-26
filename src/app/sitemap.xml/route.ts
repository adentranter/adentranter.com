import { NextRequest } from "next/server"

export const runtime = "edge"

export async function GET(_req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://adentranter.com"

  const staticRoutes = ["/", "/about", "/essays"]

  const { essays } = await import("../essays/data")
  const essayRoutes = Object.values(essays).map((essay) => `/essays/${essay.slug}`)

  const routes = [...staticRoutes, ...essayRoutes]
  const lastMod = new Date().toISOString()

  const body = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${routes
      .map(
        (route) => `
      <url>
        <loc>${baseUrl}${route}</loc>
        <lastmod>${lastMod}</lastmod>
      </url>`
      )
      .join("")}
  </urlset>`

  return new Response(body.trim(), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600", // 1 day edge cache
    },
  })
} 