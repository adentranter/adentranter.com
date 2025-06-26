import { MetadataRoute } from 'next'
import { essays } from './essays/data'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://adentranter.com'

  // Static routes that should appear in the sitemap
  const staticRoutes = ['/', '/about', '/essays']

  // Dynamic essay routes generated from the essays data object
  const essayRoutes = Object.values(essays).map((essay) => `/essays/${essay.slug}`)

  const routes = [...staticRoutes, ...essayRoutes]

  // Build the final sitemap structure. The `lastModified` field is set to now
  // but could be replaced with per-route values if available in the future.
  const now = new Date()
  return routes.map((url) => ({
    url: `${baseUrl}${url}`,
    lastModified: now,
  }))
} 