"use client"

import { FormEvent, useState } from "react"

import { UploadDropzone } from "@/lib/uploadthing"

const UPLOAD_CHALLENGE_PROMPT = "halo2?"

type UploadedFile = {
  name: string
  url: string
  size: number
}

type UploadClientProps = {
  authenticated: boolean
  configured: boolean
}

export default function UploadClient({
  authenticated: initialAuthenticated,
  configured,
}: UploadClientProps) {
  const [authenticated, setAuthenticated] = useState(initialAuthenticated)
  const [answer, setAnswer] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploads, setUploads] = useState<UploadedFile[]>([])

  async function handleAccess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/upload/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer }),
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null
        setError(data?.error ?? "Access denied.")
        return
      }

      setAuthenticated(true)
      setAnswer("")
    } catch {
      setError("Could not verify access right now.")
    } finally {
      setLoading(false)
    }
  }

  if (!configured) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4">
        <h1 className="text-3xl font-bold mb-4">Upload</h1>
        <p className="text-white/70">
          Upload is not configured yet. Set <code>UPLOADTHING_TOKEN</code> and a session secret.
        </p>
      </div>
    )
  }

  if (!authenticated) {
    return (
      <div className="max-w-md mx-auto py-16 px-4">
        <h1 className="text-3xl font-bold mb-2">Upload</h1>
        <p className="text-white/70 mb-8">Answer the question to continue.</p>

        <form
          onSubmit={handleAccess}
          className="rounded-xl border border-white/10 bg-accent/5 p-6 space-y-4"
        >
          <label htmlFor="answer" className="block text-sm font-medium text-white/80">
            {UPLOAD_CHALLENGE_PROMPT}
          </label>
          <input
            id="answer"
            type="text"
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            autoComplete="off"
            required
          />

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary/20 border border-primary/40 px-4 py-2.5 font-medium text-white transition hover:bg-primary/30 disabled:opacity-60"
          >
            {loading ? "Checking..." : "Continue"}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-16 px-4 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Upload</h1>
        <p className="text-white/70">Drop any files here. Up to 20 files, 512MB each.</p>
      </div>

      <UploadDropzone
        endpoint="anyUploader"
        onClientUploadComplete={(res) => {
          const next = res.map((file) => ({
            name: file.name,
            url: file.url,
            size: file.size,
          }))
          setUploads((current) => [...next, ...current])
        }}
        onUploadError={(uploadError) => {
          setError(uploadError.message)
        }}
      />

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      {uploads.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Uploaded</h2>
          <ul className="space-y-2">
            {uploads.map((file) => (
              <li
                key={`${file.url}-${file.name}`}
                className="rounded-lg border border-white/10 bg-accent/5 px-4 py-3 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{file.name}</p>
                  <p className="text-sm text-white/60">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <a
                  href={file.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary hover:text-accent-secondary transition-colors shrink-0"
                >
                  Open →
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
