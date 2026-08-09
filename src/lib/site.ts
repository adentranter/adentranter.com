export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://adentranter.com"

export const SITE_NAME = "Aden Tranter"
export const SITE_TITLE = "Aden Tranter - Software Engineer & Problem Solver"
export const SITE_DESCRIPTION =
  "Software engineer specializing in solving unique problems through code and curiosity."

export const SITE_OG_IMAGE = {
  url: "/adentranter.jpg",
  width: 1200,
  height: 630,
  alt: "Aden Tranter",
} as const

export const SAME_AS = [
  "https://github.com/adentranter",
  "https://linkedin.com/in/adentranter",
  "https://instagram.com/adentranter",
  "https://twitter.com/adentranter",
] as const

export function absoluteUrl(path = "/"): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path
  }
  const normalized = path.startsWith("/") ? path : `/${path}`
  return `${SITE_URL}${normalized}`
}

export function personJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: SITE_NAME,
    url: SITE_URL,
    jobTitle: "Software Engineer",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Townsville",
      addressRegion: "QLD",
      addressCountry: "AU",
    },
    sameAs: [...SAME_AS],
  }
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    publisher: {
      "@type": "Person",
      name: SITE_NAME,
      url: SITE_URL,
    },
  }
}

export function articleJsonLd({
  title,
  description,
  path,
  datePublished,
}: {
  title: string
  description: string
  path: string
  datePublished: string
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url: absoluteUrl(path),
    datePublished,
    dateModified: datePublished,
    author: {
      "@type": "Person",
      name: SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      "@type": "Person",
      name: SITE_NAME,
      url: SITE_URL,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absoluteUrl(path),
    },
    image: [absoluteUrl(SITE_OG_IMAGE.url)],
  }
}
