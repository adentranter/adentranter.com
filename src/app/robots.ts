import type { MetadataRoute } from "next"

import { SITE_URL } from "@/lib/site"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/home",
          "/home/",
          "/snes",
          "/snes/",
          "/forthelols",
          "/forthelols/",
          "/disableDefend",
          "/loves",
          "/toowicked",
          "/clone",
          "/clone/",
          "/upload",
          "/api/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
