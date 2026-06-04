import { createHmac, timingSafeEqual } from "node:crypto"

interface Riddle {
  id: string
  prompt: string
  answers: string[]
}

const RIDDLES: Riddle[] = [
  { id: "spider-legs", prompt: "How many legs does a spider have?", answers: ["8", "eight"] },
  { id: "after-seven", prompt: "What number comes after seven?", answers: ["8", "eight"] },
  { id: "days-week", prompt: "How many days are in a week?", answers: ["7", "seven"] },
  { id: "sky-color", prompt: "What colour is a clear sky during the day?", answers: ["blue"] },
  { id: "two-plus-two", prompt: "What is two plus two?", answers: ["4", "four"] },
  { id: "opposite-hot", prompt: "What is the opposite of hot?", answers: ["cold"] },
  { id: "snow-color", prompt: "What colour is snow?", answers: ["white"] },
  { id: "fish-live", prompt: "Fish live in (one word).", answers: ["water", "the sea", "ocean", "sea"] },
  { id: "sun-rises", prompt: "The sun rises in the ____ (direction).", answers: ["east"] },
  { id: "cat-says", prompt: "What sound does a cat make?", answers: ["meow", "miaow", "miao"] },
  { id: "wheels-bicycle", prompt: "How many wheels does a bicycle have?", answers: ["2", "two"] },
  { id: "first-month", prompt: "What is the first month of the year?", answers: ["january", "jan"] },
  { id: "ten-minus-three", prompt: "What is ten minus three?", answers: ["7", "seven"] },
  { id: "ocean-or-mountain-water", prompt: "Which has water: ocean or mountain?", answers: ["ocean"] },
  { id: "sky-or-ground-up", prompt: "Is the sky up or down?", answers: ["up"] },
  { id: "bee-makes", prompt: "What sweet thing do bees make?", answers: ["honey"] },
]

const TOKEN_TTL_MS = 15 * 60 * 1000
const TOKEN_VERSION = "v1"

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

function pickRiddle(): Riddle {
  return RIDDLES[Math.floor(Math.random() * RIDDLES.length)]
}

function findRiddle(id: string): Riddle | undefined {
  return RIDDLES.find((riddle) => riddle.id === id)
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

export function createChallenge(): ChallengeIssue {
  const riddle = pickRiddle()
  const exp = Date.now() + TOKEN_TTL_MS
  const payload = `${TOKEN_VERSION}.${riddle.id}.${exp}`
  const sig = sign(payload)
  return {
    prompt: riddle.prompt,
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
  const [version, riddleId, expStr, sig] = parts
  if (version !== TOKEN_VERSION) {
    return { ok: false, reason: "invalid" }
  }
  const expected = sign(`${version}.${riddleId}.${expStr}`)
  if (!safeEqual(expected, sig)) {
    return { ok: false, reason: "invalid" }
  }
  const exp = Number(expStr)
  if (!Number.isFinite(exp) || Date.now() > exp) {
    return { ok: false, reason: "expired" }
  }
  const riddle = findRiddle(riddleId)
  if (!riddle) {
    return { ok: false, reason: "invalid" }
  }
  const normalized = answer.trim().toLowerCase()
  if (!normalized) {
    return { ok: false, reason: "wrong" }
  }
  if (!riddle.answers.some((accepted) => accepted.toLowerCase() === normalized)) {
    return { ok: false, reason: "wrong" }
  }
  return { ok: true }
}
