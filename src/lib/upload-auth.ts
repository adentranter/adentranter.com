import { createHmac, timingSafeEqual } from "node:crypto"

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000
const SESSION_VERSION = "upload-v1"
export const UPLOAD_SESSION_COOKIE = "upload_session"
export const UPLOAD_CHALLENGE_PROMPT = "halo2?"

function getSecret(): string {
  const secret =
    process.env.UPLOAD_SESSION_SECRET ?? process.env.HOME_DASHBOARD_SECRET
  if (!secret) {
    throw new Error("UPLOAD_SESSION_SECRET or HOME_DASHBOARD_SECRET is not set")
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

export function getUploadAnswer(): string {
  return process.env.UPLOAD_ACCESS_ANSWER ?? "hellyeah"
}

export function isUploadConfigured(): boolean {
  return Boolean(
    process.env.UPLOAD_SESSION_SECRET ||
      process.env.HOME_DASHBOARD_SECRET
  )
}

export function signUploadSession(): string {
  const exp = Date.now() + SESSION_TTL_MS
  const payload = `${SESSION_VERSION}.${exp}`
  const sig = sign(payload)
  return `${payload}.${sig}`
}

export function verifyUploadSession(token: string | undefined | null): boolean {
  if (!token || typeof token !== "string") {
    return false
  }

  if (!isUploadConfigured()) {
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

export function getUploadSessionFromRequest(req: Request): string | undefined {
  const header = req.headers.get("cookie")
  if (!header) {
    return undefined
  }

  for (const part of header.split(";")) {
    const trimmed = part.trim()
    const separator = trimmed.indexOf("=")
    if (separator === -1) {
      continue
    }
    const key = trimmed.slice(0, separator)
    const value = trimmed.slice(separator + 1)
    if (key === UPLOAD_SESSION_COOKIE) {
      return decodeURIComponent(value)
    }
  }

  return undefined
}
