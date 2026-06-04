import type { NeonQueryFunction } from "@neondatabase/serverless"

let schemaPromise: Promise<void> | null = null

export function ensureSchema(sql: NeonQueryFunction<false, false>): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = runMigrations(sql).catch((error) => {
      schemaPromise = null
      throw error
    })
  }
  return schemaPromise
}

async function runMigrations(sql: NeonQueryFunction<false, false>): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS mailing_list_signups (
      id BIGSERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT,
      notes TEXT,
      source TEXT NOT NULL DEFAULT 'homepage',
      user_agent TEXT,
      referrer TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS essays (
      slug TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      excerpt TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL,
      published_on DATE NOT NULL,
      listed BOOLEAN NOT NULL DEFAULT TRUE,
      content_sha TEXT NOT NULL,
      synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS essay_comments (
      id BIGSERIAL PRIMARY KEY,
      essay_slug TEXT NOT NULL REFERENCES essays(slug) ON DELETE CASCADE,
      author_name TEXT NOT NULL,
      body TEXT NOT NULL,
      ip_hash TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`
    CREATE INDEX IF NOT EXISTS essay_comments_slug_created_at_idx
    ON essay_comments (essay_slug, created_at)
  `
}
