import { createHmac, timingSafeEqual } from "node:crypto"

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000
const SESSION_VERSION = "v1"
export const HOME_SESSION_COOKIE = "home_session"

function getSecret(): string {
  const secret = process.env.HOME_DASHBOARD_SECRET
  if (!secret) {
    throw new Error("HOME_DASHBOARD_SECRET is not set")
  }
  return secret
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url")
}

export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) {
    return false
  }
  return timingSafeEqual(bufA, bufB)
}

export function signSession(): string {
  const exp = Date.now() + SESSION_TTL_MS
  const payload = `${SESSION_VERSION}.${exp}`
  const sig = sign(payload)
  return `${payload}.${sig}`
}

export function verifySession(token: string | undefined | null): boolean {
  if (!token || typeof token !== "string") {
    return false
  }

  if (!process.env.HOME_DASHBOARD_SECRET) {
    return false
  }

  const parts = token.split(".")
  if (parts.length !== 3) {
    return false
  }

  const [version, expStr, sig] = parts
  if (version !== SESSION_VERSION) {
    return false
  }

  let expected: string
  try {
    expected = sign(`${version}.${expStr}`)
  } catch {
    return false
  }

  if (!safeEqual(expected, sig)) {
    return false
  }

  const exp = Number(expStr)
  if (!Number.isFinite(exp) || Date.now() > exp) {
    return false
  }

  return true
}

export function getDashboardPassword(): string | null {
  return process.env.HOME_DASHBOARD_PASSWORD ?? null
}

export function isDashboardConfigured(): boolean {
  return Boolean(process.env.HOME_DASHBOARD_PASSWORD && process.env.HOME_DASHBOARD_SECRET)
}
