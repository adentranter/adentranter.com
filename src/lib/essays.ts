import { essays as essayRegistry, type EssayMeta as RegistryEssayMeta } from "@/app/essays/data"

import { getSql } from "./db"
import { ensureSchema } from "./schema"

export interface EssaySummary {
  slug: string
  title: string
  excerpt: string
  date: string
  listed: boolean
}

export interface EssayRecord extends EssaySummary {
  body: string
}

function toIsoDate(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10)
  }
  if (typeof value === "string") {
    return value.slice(0, 10)
  }
  return ""
}

function fallbackSummary(meta: RegistryEssayMeta): EssaySummary {
  return {
    slug: meta.slug,
    title: meta.title,
    excerpt: meta.excerpt ?? "",
    date: meta.date,
    listed: meta.listed !== false,
  }
}

function fallbackList(): EssaySummary[] {
  return Object.values(essayRegistry)
    .filter((essay) => essay.listed !== false)
    .map(fallbackSummary)
}

export async function getListedEssays(): Promise<EssaySummary[]> {
  const sql = getSql()
  if (!sql) {
    return fallbackList()
  }

  try {
    await ensureSchema(sql)
    const rows = await sql`
      SELECT slug, title, excerpt, published_on, listed
      FROM essays
      WHERE listed = TRUE
      ORDER BY published_on DESC
    `
    if (rows.length === 0) {
      return fallbackList()
    }
    return rows.map((row) => ({
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt ?? "",
      date: toIsoDate(row.published_on),
      listed: row.listed,
    }))
  } catch (error) {
    console.error("[essays] getListedEssays failed", error)
    return fallbackList()
  }
}

function fallbackListedSlugs(): string[] {
  return Object.values(essayRegistry)
    .filter((essay) => essay.listed !== false)
    .map((essay) => essay.slug)
}

export async function getAllEssaySlugs(): Promise<string[]> {
  const sql = getSql()
  if (!sql) {
    return fallbackListedSlugs()
  }

  try {
    await ensureSchema(sql)
    const rows = await sql`SELECT slug FROM essays WHERE listed = TRUE ORDER BY published_on DESC`
    if (rows.length === 0) {
      return fallbackListedSlugs()
    }
    return rows.map((row) => row.slug as string)
  } catch (error) {
    console.error("[essays] getAllEssaySlugs failed", error)
    return fallbackListedSlugs()
  }
}

export async function getEssayBySlug(slug: string): Promise<EssayRecord | null> {
  const sql = getSql()
  if (!sql) {
    return null
  }

  try {
    await ensureSchema(sql)
    const rows = await sql`
      SELECT slug, title, excerpt, body, published_on, listed
      FROM essays
      WHERE slug = ${slug}
      LIMIT 1
    `
    if (rows.length === 0) {
      return null
    }
    const row = rows[0]
    return {
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt ?? "",
      date: toIsoDate(row.published_on),
      listed: row.listed,
      body: row.body,
    }
  } catch (error) {
    console.error("[essays] getEssayBySlug failed", error)
    return null
  }
}
