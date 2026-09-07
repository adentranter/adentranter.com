import { Pool, type PoolConfig, type QueryResultRow } from "pg"

export type Sql = <T extends QueryResultRow = QueryResultRow>(
  strings: TemplateStringsArray,
  ...values: unknown[]
) => Promise<T[]>

const globalForDb = globalThis as unknown as {
  pgPool: Pool | undefined
  pgSql: Sql | undefined
}

function getDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL?.trim()
  return url || undefined
}

function createPool(connectionString: string): Pool {
  const config: PoolConfig = {
    connectionString,
    max: Number(process.env.PG_POOL_MAX ?? 5),
  }
  return new Pool(config)
}

function createSql(pool: Pool): Sql {
  function sql<T extends QueryResultRow = QueryResultRow>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T[]> {
    let text = ""
    const params: unknown[] = []
    for (let i = 0; i < strings.length; i += 1) {
      text += strings[i]
      if (i < values.length) {
        params.push(values[i])
        text += `$${params.length}`
      }
    }
    return pool.query<T>(text, params).then((result) => result.rows)
  }
  return sql
}

export function getSql(): Sql | null {
  const databaseUrl = getDatabaseUrl()
  if (!databaseUrl) {
    return null
  }
  if (!globalForDb.pgSql) {
    const pool = globalForDb.pgPool ?? createPool(databaseUrl)
    globalForDb.pgPool = pool
    globalForDb.pgSql = createSql(pool)
  }
  return globalForDb.pgSql
}

export class DatabaseUnavailableError extends Error {
  constructor() {
    super("Database is not configured.")
    this.name = "DatabaseUnavailableError"
  }
}

export function requireSql(): Sql {
  const sql = getSql()
  if (!sql) {
    throw new DatabaseUnavailableError()
  }
  return sql
}
