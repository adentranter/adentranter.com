"use client"

import { useEffect, useMemo, useState } from "react"

import {
  DUE_DATE_ISO,
  DUE_DATE_LABEL,
  PREGNANCY_LENGTH_DAYS,
  getPregnancyStartMs,
} from "@/lib/clone"

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  totalMs: number
}

const TRIMESTERS = [
  { id: "t1", label: "First", short: "T1", startWeek: 1, endWeek: 13 },
  { id: "t2", label: "Second", short: "T2", startWeek: 14, endWeek: 27 },
  { id: "t3", label: "Third", short: "T3", startWeek: 28, endWeek: 40 },
] as const

function pad(value: number): string {
  return value.toString().padStart(2, "0")
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function getTimeLeft(nowMs: number, dueMs: number): TimeLeft {
  const totalMs = Math.max(0, dueMs - nowMs)
  const totalSeconds = Math.floor(totalMs / 1000)
  return {
    totalMs,
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  }
}

function currentTrimester(week: number): (typeof TRIMESTERS)[number] {
  return TRIMESTERS.find((t) => week >= t.startWeek && week <= t.endWeek) ?? TRIMESTERS[2]
}

export default function CloneCountdown({
  initialNowMs,
}: {
  readonly initialNowMs: number
}) {
  const dueMs = useMemo(() => new Date(DUE_DATE_ISO).getTime(), [])
  const startMs = useMemo(() => getPregnancyStartMs(dueMs), [dueMs])
  const [nowMs, setNowMs] = useState(initialNowMs)

  useEffect(() => {
    const tick = () => setNowMs(Date.now())
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [])

  const elapsedMs = clamp(nowMs - startMs, 0, dueMs - startMs)
  const elapsedDays = elapsedMs / (24 * 60 * 60 * 1000)
  const progress = clamp(elapsedDays / PREGNANCY_LENGTH_DAYS, 0, 1)
  const week = clamp(Math.floor(elapsedDays / 7) + 1, 1, 40)
  const weekExact = elapsedDays / 7
  const daysIntoWeek = Math.floor(elapsedDays % 7)
  const trimester = currentTrimester(week)
  const timeLeft = getTimeLeft(nowMs, dueMs)
  const arrived = timeLeft.totalMs <= 0
  const remainingWeeks = Math.max(0, 40 - week)
  const progressPct = Math.round(progress * 1000) / 10

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#140e12] text-rose-50">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-24 top-[-8rem] h-80 w-80 rounded-full bg-rose-500/20 blur-3xl" />
        <div className="absolute -right-16 top-24 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="absolute bottom-[-6rem] left-1/3 h-96 w-96 rounded-full bg-fuchsia-700/10 blur-3xl" />
      </div>

      <main className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-10 px-5 py-16 sm:px-8">
        <header className="space-y-3 text-center">
          <p className="text-[11px] uppercase tracking-[0.35em] text-rose-200/55">/clone</p>
          <h1 className="font-[family-name:var(--font-fraunces)] text-4xl font-light tracking-tight text-rose-50 sm:text-5xl">
            {arrived ? "The clone has landed." : "A little clone is on the way."}
          </h1>
          <p className="text-sm text-rose-100/70 sm:text-base">
            {arrived
              ? `Due date was ${DUE_DATE_LABEL}. Welcome to the world.`
              : `Due ${DUE_DATE_LABEL}. Private countdown — just for us.`}
          </p>
        </header>

        {arrived ? (
          <p className="text-center font-[family-name:var(--font-fraunces)] text-3xl text-amber-200">
            They&apos;re here.
          </p>
        ) : (
          <section aria-label="Time remaining" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Days", value: timeLeft.days.toString() },
              { label: "Hours", value: pad(timeLeft.hours) },
              { label: "Minutes", value: pad(timeLeft.minutes) },
              { label: "Seconds", value: pad(timeLeft.seconds) },
            ].map((unit) => (
              <div
                key={unit.label}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-5 text-center backdrop-blur-sm"
              >
                <div className="font-[family-name:var(--font-fraunces)] text-4xl tabular-nums tracking-tight text-white sm:text-5xl">
                  {unit.value}
                </div>
                <div className="mt-2 text-[11px] uppercase tracking-[0.22em] text-rose-200/55">
                  {unit.label}
                </div>
              </div>
            ))}
          </section>
        )}

        <section className="space-y-6 rounded-3xl border border-white/10 bg-black/25 p-5 sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-rose-200/55">Timeline</p>
              <p className="mt-1 font-[family-name:var(--font-fraunces)] text-2xl text-white">
                Week {week}
                <span className="text-lg text-rose-100/55"> of 40</span>
              </p>
            </div>
            <p className="text-sm text-rose-100/70">
              {trimester.label} trimester · {progressPct}% through
            </p>
          </div>

          <PregnancyTimeline progress={progress} weekExact={weekExact} />

          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <Stat label="Gestational" value={`Week ${week}+${daysIntoWeek}`} />
            <Stat label="Elapsed" value={`${Math.floor(elapsedDays)} days`} />
            <Stat label="Remaining" value={arrived ? "0 weeks" : `~${remainingWeeks} weeks`} />
            <Stat label="Trimester" value={trimester.short} />
          </dl>
        </section>
      </main>
    </div>
  )
}

function Stat({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
      <dt className="text-[11px] uppercase tracking-[0.18em] text-rose-200/45">{label}</dt>
      <dd className="mt-1 text-white/90">{value}</dd>
    </div>
  )
}

function nowAnchor(progress: number): "start" | "middle" | "end" {
  if (progress > 0.82) return "end"
  if (progress < 0.18) return "start"
  return "middle"
}

function PregnancyTimeline({
  progress,
  weekExact,
}: {
  readonly progress: number
  readonly weekExact: number
}) {
  const width = 1000
  const height = 150
  const barY = 62
  const barH = 28
  const padX = 28
  const innerW = width - padX * 2
  const nowX = padX + clamp(progress, 0, 1) * innerW

  const trimesterStops = TRIMESTERS.map((t) => {
    const start = ((t.startWeek - 1) / 40) * innerW + padX
    const end = (t.endWeek / 40) * innerW + padX
    return { ...t, start, end }
  })

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Pregnancy timeline, currently week ${weekExact.toFixed(1)} of 40`}
      >
        <defs>
          <linearGradient id="clone-progress" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fb7185" />
            <stop offset="55%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#fde68a" />
          </linearGradient>
        </defs>

        {trimesterStops.map((t) => (
          <g key={t.id}>
            <rect
              x={t.start}
              y={barY}
              width={t.end - t.start - 4}
              height={barH}
              rx="8"
              fill="rgba(255,255,255,0.06)"
            />
            <text
              x={(t.start + t.end) / 2}
              y={barY - 14}
              textAnchor="middle"
              fill="rgba(255,228,230,0.55)"
              fontSize="18"
              letterSpacing="0.12em"
            >
              {t.label.toUpperCase()}
            </text>
          </g>
        ))}

        <rect
          x={padX}
          y={barY}
          width={Math.max(8, clamp(progress, 0, 1) * innerW)}
          height={barH}
          rx="8"
          fill="url(#clone-progress)"
          opacity="0.92"
        />

        <line
          x1={nowX}
          y1={barY - 8}
          x2={nowX}
          y2={barY + barH + 8}
          stroke="#fff7ed"
          strokeWidth="3"
        />
        <circle cx={nowX} cy={barY + barH / 2} r="7" fill="#fff7ed" />

        <text x={padX} y={barY + barH + 32} fill="rgba(255,228,230,0.45)" fontSize="16">
          Start
        </text>
        <text
          x={nowX}
          y={barY + barH + 32}
          textAnchor={nowAnchor(progress)}
          fill="#ffe4e6"
          fontSize="16"
        >
          now
        </text>
        <text
          x={padX + innerW}
          y={barY + barH + 32}
          textAnchor="end"
          fill="rgba(255,228,230,0.45)"
          fontSize="16"
        >
          Due
        </text>
      </svg>
    </div>
  )
}
