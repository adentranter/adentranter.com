import { createHash } from "node:crypto"
import { promises as fs } from "node:fs"
import path from "node:path"

import { essays } from "@/app/essays/data"

import { getSql } from "./db"
import { ensureSchema } from "./schema"

const ESSAYS_CONTENT_DIR = path.join(process.cwd(), "src", "app", "essays", "content")

export interface SyncSummary {
  updated: number
  unchanged: number
  failed: number
}

let syncPromise: Promise<SyncSummary> | null = null

export function syncEssaysFromFiles(): Promise<SyncSummary> {
  if (!syncPromise) {
    syncPromise = runSync().catch((error) => {
      syncPromise = null
      throw error
    })
  }
  return syncPromise
}

async function runSync(): Promise<SyncSummary> {
  const sql = getSql()
  if (!sql) {
    console.warn("[essays-sync] NEON_DATABASE_URL not set; skipping sync")
    return { updated: 0, unchanged: 0, failed: 0 }
  }

  await ensureSchema(sql)

  const summary: SyncSummary = { updated: 0, unchanged: 0, failed: 0 }
  const entries = Object.values(essays)

  for (const meta of entries) {
    try {
      const filePath = path.join(ESSAYS_CONTENT_DIR, `${meta.slug}.md`)
      const body = await fs.readFile(filePath, "utf8")
      const contentSha = sha256(
        `${meta.title}\n${meta.excerpt}\n${meta.date}\n${meta.listed !== false}\n${body}`
      )

      const existing = await sql`
        SELECT content_sha FROM essays WHERE slug = ${meta.slug}
      `

      if (existing.length > 0 && existing[0].content_sha === contentSha) {
        summary.unchanged += 1
        continue
      }

      await sql`
        INSERT INTO essays (slug, title, excerpt, body, published_on, listed, content_sha, synced_at)
        VALUES (
          ${meta.slug},
          ${meta.title},
          ${meta.excerpt ?? ""},
          ${body},
          ${meta.date},
          ${meta.listed !== false},
          ${contentSha},
          NOW()
        )
        ON CONFLICT (slug) DO UPDATE SET
          title = EXCLUDED.title,
          excerpt = EXCLUDED.excerpt,
          body = EXCLUDED.body,
          published_on = EXCLUDED.published_on,
          listed = EXCLUDED.listed,
          content_sha = EXCLUDED.content_sha,
          synced_at = NOW()
      `
      summary.updated += 1
    } catch (error) {
      summary.failed += 1
      console.error(`[essays-sync] failed for ${meta.slug}`, error)
    }
  }

  console.log(
    `[essays-sync] updated=${summary.updated} unchanged=${summary.unchanged} failed=${summary.failed}`
  )

  return summary
}

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex")
}
