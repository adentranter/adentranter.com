"use client"

import { FormEvent, useState } from "react"

type SubmitState = "idle" | "submitting" | "success" | "error"

export function MailingListSignup() {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [submitState, setSubmitState] = useState<SubmitState>("idle")
  const [message, setMessage] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitState("submitting")
    setMessage("")

    try {
      const response = await fetch("/api/mailing-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          source: "homepage-callout",
        }),
      })

      const data = (await response.json()) as { error?: string }

      if (!response.ok) {
        throw new Error(data.error || "Could not subscribe right now.")
      }

      setSubmitState("success")
      setMessage("Thanks! You are on the list.")
      setEmail("")
      setName("")
    } catch (error) {
      setSubmitState("error")
      setMessage(error instanceof Error ? error.message : "Could not subscribe right now.")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3" noValidate>
      <label className="block">
        <span className="mb-1 block text-xs uppercase tracking-wide text-white/55">Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
          className="w-full rounded-md border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-primary focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs uppercase tracking-wide text-white/55">
          Name <span className="text-white/35">(optional)</span>
        </span>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Aden fan club member"
          className="w-full rounded-md border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-primary focus:outline-none"
        />
      </label>

      <button
        type="submit"
        disabled={submitState === "submitting"}
        className="rounded-md border border-primary/40 bg-primary/20 px-4 py-2 text-sm text-primary transition-colors hover:bg-primary/30 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitState === "submitting" ? "Subscribing..." : "Join mailing list"}
      </button>

      {message ? (
        <output
          className={`block text-sm ${submitState === "success" ? "text-green-400" : "text-red-400"}`}
        >
          {message}
        </output>
      ) : null}
    </form>
  )
}
