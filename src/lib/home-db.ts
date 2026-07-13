import { getSql } from "@/lib/db"
import { ensureSchema } from "@/lib/schema"

export interface HomeIpRecord {
  ip: string
  updatedAt: Date
}

export async function getLatestHomeIp(): Promise<HomeIpRecord | null> {
  const sql = getSql()
  if (!sql) {
    return null
  }

  await ensureSchema(sql)

  const rows = await sql`
    SELECT ip, updated_at
    FROM home_ip
    WHERE id = 1
    LIMIT 1
  `

  const row = rows[0]
  if (!row) {
    return null
  }

  return {
    ip: String(row.ip),
    updatedAt: new Date(String(row.updated_at)),
  }
}
