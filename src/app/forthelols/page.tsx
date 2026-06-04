import type { Metadata } from "next"
import Link from "next/link"

import { getSql } from "@/lib/db"
import { ensureSchema } from "@/lib/schema"

import { DeleteCommentButton } from "./_components/delete-comment-button"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export const metadata: Metadata = {
  title: "forthelols",
  robots: { index: false, follow: false },
}

interface Stats {
  totalSignups: number
  signupsLast7Days: number
  totalComments: number
  commentsLast7Days: number
  totalEssays: number
}

interface PerEssayCount {
  slug: string
  title: string | null
  count: number
}

interface RecentComment {
  id: string
  essaySlug: string
  authorName: string
  body: string
  createdAt: string
}

interface RecentSignup {
  email: string
  name: string | null
  source: string
  createdAt: string
}

interface EssayRow {
  slug: string
  title: string
  listed: boolean
  syncedAt: string
}

interface DashboardData {
  stats: Stats
  perEssay: PerEssayCount[]
  recentComments: RecentComment[]
  recentSignups: RecentSignup[]
  essays: EssayRow[]
}

function toIso(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString()
  }
  if (typeof value === "string") {
    return new Date(value).toISOString()
  }
  return ""
}

function formatDateTime(iso: string): string {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  } catch {
    return iso
  }
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return `${text.slice(0, max - 1)}…`
}

async function loadDashboard(): Promise<DashboardData | null> {
  const sql = getSql()
  if (!sql) {
    return null
  }
  await ensureSchema(sql)

  const [
    signupTotal,
    signupRecent,
    commentTotal,
    commentRecent,
    essayTotal,
    perEssayRows,
    recentCommentRows,
    recentSignupRows,
    essayRows,
  ] = await Promise.all([
    sql`SELECT COUNT(*)::int AS count FROM mailing_list_signups`,
    sql`SELECT COUNT(*)::int AS count FROM mailing_list_signups WHERE created_at > NOW() - INTERVAL '7 days'`,
    sql`SELECT COUNT(*)::int AS count FROM essay_comments`,
    sql`SELECT COUNT(*)::int AS count FROM essay_comments WHERE created_at > NOW() - INTERVAL '7 days'`,
    sql`SELECT COUNT(*)::int AS count FROM essays`,
    sql`
      SELECT c.essay_slug AS slug, e.title AS title, COUNT(*)::int AS count
      FROM essay_comments c
      LEFT JOIN essays e ON e.slug = c.essay_slug
      GROUP BY c.essay_slug, e.title
      ORDER BY count DESC, c.essay_slug ASC
    `,
    sql`
      SELECT id, essay_slug, author_name, body, created_at
      FROM essay_comments
      ORDER BY created_at DESC
      LIMIT 20
    `,
    sql`
      SELECT email, name, source, created_at
      FROM mailing_list_signups
      ORDER BY created_at DESC
      LIMIT 20
    `,
    sql`
      SELECT slug, title, listed, synced_at
      FROM essays
      ORDER BY synced_at DESC
    `,
  ])

  return {
    stats: {
      totalSignups: Number(signupTotal[0]?.count ?? 0),
      signupsLast7Days: Number(signupRecent[0]?.count ?? 0),
      totalComments: Number(commentTotal[0]?.count ?? 0),
      commentsLast7Days: Number(commentRecent[0]?.count ?? 0),
      totalEssays: Number(essayTotal[0]?.count ?? 0),
    },
    perEssay: perEssayRows.map((row) => ({
      slug: row.slug,
      title: row.title ?? null,
      count: Number(row.count),
    })),
    recentComments: recentCommentRows.map((row) => ({
      id: String(row.id),
      essaySlug: row.essay_slug,
      authorName: row.author_name,
      body: row.body,
      createdAt: toIso(row.created_at),
    })),
    recentSignups: recentSignupRows.map((row) => ({
      email: row.email,
      name: row.name ?? null,
      source: row.source,
      createdAt: toIso(row.created_at),
    })),
    essays: essayRows.map((row) => ({
      slug: row.slug,
      title: row.title,
      listed: row.listed,
      syncedAt: toIso(row.synced_at),
    })),
  }
}

interface StatTileProps {
  readonly label: string
  readonly value: number | string
  readonly hint?: string
}

function StatTile({ label, value, hint }: StatTileProps) {
  return (
    <div className="rounded-md border border-white/10 bg-black/30 p-4">
      <div className="text-xs uppercase tracking-wide text-white/55">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
      {hint ? <div className="mt-1 text-xs text-white/45">{hint}</div> : null}
    </div>
  )
}

export default async function ForTheLolsPage() {
  let data: DashboardData | null = null
  let error: string | null = null
  try {
    data = await loadDashboard()
  } catch (err) {
    error = err instanceof Error ? err.message : "Could not load dashboard."
    console.error("[forthelols] loadDashboard failed", err)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-white">forthelols</h1>
        <p className="text-sm text-white/55">Private dashboard. Not for public eyes.</p>
      </header>

      {data === null && !error ? (
        <p className="rounded-md border border-white/10 bg-black/30 p-4 text-sm text-white/65">
          Database is not configured. Set <code>NEON_DATABASE_URL</code> and reload.
        </p>
      ) : null}

      {error ? (
        <p className="rounded-md border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      {data ? (
        <div className="space-y-10">
          <section>
            <h2 className="mb-3 text-sm uppercase tracking-wide text-white/55">Stats</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              <StatTile label="Mailing list" value={data.stats.totalSignups} />
              <StatTile
                label="Signups (7d)"
                value={data.stats.signupsLast7Days}
                hint="last 7 days"
              />
              <StatTile label="Comments" value={data.stats.totalComments} />
              <StatTile
                label="Comments (7d)"
                value={data.stats.commentsLast7Days}
                hint="last 7 days"
              />
              <StatTile label="Essays" value={data.stats.totalEssays} />
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm uppercase tracking-wide text-white/55">Comments per essay</h2>
            {data.perEssay.length === 0 ? (
              <p className="text-sm text-white/45">No comments yet.</p>
            ) : (
              <div className="overflow-hidden rounded-md border border-white/10">
                <table className="w-full text-left text-sm">
                  <thead className="bg-black/40 text-xs uppercase tracking-wide text-white/55">
                    <tr>
                      <th className="px-3 py-2">Essay</th>
                      <th className="px-3 py-2 text-right">Comments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.perEssay.map((row) => (
                      <tr key={row.slug} className="border-t border-white/10">
                        <td className="px-3 py-2">
                          <Link
                            href={`/essays/${row.slug}`}
                            className="text-white/85 underline-offset-2 hover:underline"
                          >
                            {row.title ?? row.slug}
                          </Link>
                          <span className="ml-2 text-xs text-white/40">{row.slug}</span>
                        </td>
                        <td className="px-3 py-2 text-right text-white/85">{row.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-sm uppercase tracking-wide text-white/55">Recent comments</h2>
            {data.recentComments.length === 0 ? (
              <p className="text-sm text-white/45">No comments yet.</p>
            ) : (
              <div className="space-y-3">
                {data.recentComments.map((comment) => (
                  <article
                    key={comment.id}
                    className="rounded-md border border-white/10 bg-black/20 p-4"
                  >
                    <header className="mb-2 flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-medium text-white/85">{comment.authorName}</div>
                        <div className="text-xs text-white/45">
                          on{" "}
                          <Link
                            href={`/essays/${comment.essaySlug}`}
                            className="underline-offset-2 hover:underline"
                          >
                            {comment.essaySlug}
                          </Link>
                          {" • "}
                          <time>{formatDateTime(comment.createdAt)}</time>
                        </div>
                      </div>
                      <DeleteCommentButton commentId={comment.id} />
                    </header>
                    <p className="whitespace-pre-wrap text-sm text-white/75">{comment.body}</p>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-sm uppercase tracking-wide text-white/55">Recent mailing list signups</h2>
            {data.recentSignups.length === 0 ? (
              <p className="text-sm text-white/45">No signups yet.</p>
            ) : (
              <div className="overflow-hidden rounded-md border border-white/10">
                <table className="w-full text-left text-sm">
                  <thead className="bg-black/40 text-xs uppercase tracking-wide text-white/55">
                    <tr>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Source</th>
                      <th className="px-3 py-2">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentSignups.map((row) => (
                      <tr key={row.email} className="border-t border-white/10">
                        <td className="px-3 py-2 text-white/85">{row.email}</td>
                        <td className="px-3 py-2 text-white/70">{row.name ?? "—"}</td>
                        <td className="px-3 py-2 text-white/55">{truncate(row.source, 32)}</td>
                        <td className="px-3 py-2 text-white/55">{formatDateTime(row.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-sm uppercase tracking-wide text-white/55">Essays</h2>
            {data.essays.length === 0 ? (
              <p className="text-sm text-white/45">No essays synced yet.</p>
            ) : (
              <div className="overflow-hidden rounded-md border border-white/10">
                <table className="w-full text-left text-sm">
                  <thead className="bg-black/40 text-xs uppercase tracking-wide text-white/55">
                    <tr>
                      <th className="px-3 py-2">Title</th>
                      <th className="px-3 py-2">Slug</th>
                      <th className="px-3 py-2">Listed</th>
                      <th className="px-3 py-2">Last synced</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.essays.map((row) => (
                      <tr key={row.slug} className="border-t border-white/10">
                        <td className="px-3 py-2 text-white/85">
                          <Link
                            href={`/essays/${row.slug}`}
                            className="underline-offset-2 hover:underline"
                          >
                            {row.title}
                          </Link>
                        </td>
                        <td className="px-3 py-2 text-white/55">{row.slug}</td>
                        <td className="px-3 py-2 text-white/70">{row.listed ? "yes" : "no"}</td>
                        <td className="px-3 py-2 text-white/55">{formatDateTime(row.syncedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  )
}
