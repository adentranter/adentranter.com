import { neon, type NeonQueryFunction } from "@neondatabase/serverless"

let cachedSql: NeonQueryFunction<false, false> | null = null

export function getSql(): NeonQueryFunction<false, false> | null {
  const databaseUrl = process.env.NEON_DATABASE_URL
  if (!databaseUrl) {
    return null
  }
  if (!cachedSql) {
    cachedSql = neon(databaseUrl)
  }
  return cachedSql
}

export class DatabaseUnavailableError extends Error {
  constructor() {
    super("Database is not configured.")
    this.name = "DatabaseUnavailableError"
  }
}

export function requireSql(): NeonQueryFunction<false, false> {
  const sql = getSql()
  if (!sql) {
    throw new DatabaseUnavailableError()
  }
  return sql
}
