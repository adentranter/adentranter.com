import { createHmac, randomInt, timingSafeEqual } from "node:crypto"

const TOKEN_TTL_MS = 15 * 60 * 1000
const TOKEN_VERSION = "v2"

export interface ChallengeIssue {
  prompt: string
  token: string
}

export interface ChallengeVerifyResult {
  ok: boolean
  reason?: "invalid" | "expired" | "wrong"
}

function getSecret(): string {
  const secret = process.env.COMMENT_CHALLENGE_SECRET
  if (!secret) {
    throw new Error("COMMENT_CHALLENGE_SECRET is not set")
  }
  return secret
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url")
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) {
    return false
  }
  return timingSafeEqual(bufA, bufB)
}

interface MathProblem {
  prompt: string
  answer: number
}

function generateProblem(): MathProblem {
  const op = randomInt(0, 3)
  if (op === 0) {
    const a = randomInt(1, 11)
    const b = randomInt(1, 11)
    return { prompt: `What is ${a} + ${b}?`, answer: a + b }
  }
  if (op === 1) {
    const a = randomInt(2, 16)
    const b = randomInt(1, a)
    return { prompt: `What is ${a} - ${b}?`, answer: a - b }
  }
  const a = randomInt(2, 7)
  const b = randomInt(2, 7)
  return { prompt: `What is ${a} \u00d7 ${b}?`, answer: a * b }
}

export function createChallenge(): ChallengeIssue {
  const { prompt, answer } = generateProblem()
  const exp = Date.now() + TOKEN_TTL_MS
  const payload = `${TOKEN_VERSION}.${answer}.${exp}`
  const sig = sign(payload)
  return {
    prompt,
    token: `${payload}.${sig}`,
  }
}

export function verifyChallenge(token: string, answer: string): ChallengeVerifyResult {
  if (typeof token !== "string" || typeof answer !== "string") {
    return { ok: false, reason: "invalid" }
  }
  const parts = token.split(".")
  if (parts.length !== 4) {
    return { ok: false, reason: "invalid" }
  }
  const [version, answerStr, expStr, sig] = parts
  if (version !== TOKEN_VERSION) {
    return { ok: false, reason: "invalid" }
  }
  const expected = sign(`${version}.${answerStr}.${expStr}`)
  if (!safeEqual(expected, sig)) {
    return { ok: false, reason: "invalid" }
  }
  const exp = Number(expStr)
  if (!Number.isFinite(exp) || Date.now() > exp) {
    return { ok: false, reason: "expired" }
  }
  const expectedAnswer = Number(answerStr)
  if (!Number.isInteger(expectedAnswer)) {
    return { ok: false, reason: "invalid" }
  }
  const submitted = Number.parseInt(answer.trim(), 10)
  if (!Number.isFinite(submitted) || submitted !== expectedAnswer) {
    return { ok: false, reason: "wrong" }
  }
  return { ok: true }
}
