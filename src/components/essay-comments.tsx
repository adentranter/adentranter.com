"use client"

import { FormEvent, useCallback, useEffect, useState } from "react"

interface Comment {
  id: string
  authorName: string
  body: string
  createdAt: string
}

interface Challenge {
  prompt: string
  token: string
}

type SubmitState = "idle" | "submitting" | "success" | "error"

interface EssayCommentsProps {
  readonly slug: string
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  } catch {
    return iso
  }
}

interface CommentListProps {
  readonly loading: boolean
  readonly error: string | null
  readonly comments: ReadonlyArray<Comment>
}

function challengePromptText(loading: boolean, challenge: Challenge | null): string {
  if (loading) return "Loading..."
  if (challenge) return challenge.prompt
  return "Check unavailable."
}

function CommentList({ loading, error, comments }: CommentListProps) {
  if (loading) {
    return <p className="text-sm text-white/45">Loading comments...</p>
  }
  if (error) {
    return <p className="text-sm text-red-400">{error}</p>
  }
  if (comments.length === 0) {
    return <p className="text-sm text-white/45">No comments yet. Be the first.</p>
  }
  return (
    <>
      {comments.map((comment) => (
        <article
          key={comment.id}
          className="rounded-md border border-white/10 bg-black/20 p-4"
        >
          <header className="flex items-baseline justify-between gap-4 mb-2">
            <span className="text-sm font-medium text-white/85">{comment.authorName}</span>
            <time className="text-xs text-white/40">{formatDate(comment.createdAt)}</time>
          </header>
          <p className="text-sm text-white/75 whitespace-pre-wrap leading-relaxed">
            {comment.body}
          </p>
        </article>
      ))}
    </>
  )
}

export function EssayComments({ slug }: EssayCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(true)
  const [commentsError, setCommentsError] = useState<string | null>(null)

  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [challengeLoading, setChallengeLoading] = useState(false)

  const [authorName, setAuthorName] = useState("")
  const [body, setBody] = useState("")
  const [answer, setAnswer] = useState("")
  const [website, setWebsite] = useState("")

  const [submitState, setSubmitState] = useState<SubmitState>("idle")
  const [message, setMessage] = useState("")

  const loadComments = useCallback(async () => {
    setCommentsLoading(true)
    setCommentsError(null)
    try {
      const response = await fetch(`/api/essays/${slug}/comments`, { cache: "no-store" })
      const data = (await response.json()) as { comments?: Comment[]; error?: string }
      if (!response.ok) {
        throw new Error(data.error || "Could not load comments.")
      }
      setComments(data.comments ?? [])
    } catch (error) {
      setCommentsError(error instanceof Error ? error.message : "Could not load comments.")
    } finally {
      setCommentsLoading(false)
    }
  }, [slug])

  const loadChallenge = useCallback(async () => {
    setChallengeLoading(true)
    try {
      const response = await fetch(`/api/essays/${slug}/comment-challenge`, { cache: "no-store" })
      const data = (await response.json()) as Challenge & { error?: string }
      if (!response.ok) {
        throw new Error(data.error || "Could not load check.")
      }
      setChallenge({ prompt: data.prompt, token: data.token })
      setAnswer("")
    } catch (error) {
      setChallenge(null)
      setMessage(error instanceof Error ? error.message : "Could not load check.")
      setSubmitState("error")
    } finally {
      setChallengeLoading(false)
    }
  }, [slug])

  useEffect(() => {
    void loadComments()
    void loadChallenge()
  }, [loadComments, loadChallenge])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!challenge) {
      setMessage("Check is still loading. Try again in a moment.")
      setSubmitState("error")
      return
    }

    setSubmitState("submitting")
    setMessage("")

    try {
      const response = await fetch(`/api/essays/${slug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName,
          body,
          challengeToken: challenge.token,
          challengeAnswer: answer,
          website,
        }),
      })

      const data = (await response.json()) as { ok?: boolean; comment?: Comment; error?: string }

      if (!response.ok) {
        throw new Error(data.error || "Could not post your comment.")
      }

      if (data.comment) {
        const newComment = data.comment
        setComments((prev) => [...prev, newComment])
      }
      setSubmitState("success")
      setMessage("Comment posted. Thanks!")
      setBody("")
      setAnswer("")
      void loadChallenge()
    } catch (error) {
      setSubmitState("error")
      setMessage(error instanceof Error ? error.message : "Could not post your comment.")
      void loadChallenge()
    }
  }

  return (
    <section className="mt-16 border-t border-white/10 pt-10">
      <h2 className="text-xl font-semibold mb-6">Comments</h2>

      <div className="space-y-4 mb-10">
        <CommentList loading={commentsLoading} error={commentsError} comments={comments} />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        <h3 className="text-sm uppercase tracking-wide text-white/55">Leave a comment</h3>

        <label className="block">
          <span className="mb-1 block text-xs uppercase tracking-wide text-white/55">Name</span>
          <input
            type="text"
            required
            value={authorName}
            onChange={(event) => setAuthorName(event.target.value)}
            maxLength={80}
            placeholder="Your name"
            className="w-full rounded-md border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-primary focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs uppercase tracking-wide text-white/55">Comment</span>
          <textarea
            required
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={2000}
            rows={4}
            placeholder="Add to the conversation"
            className="w-full rounded-md border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-primary focus:outline-none"
          />
        </label>

        <div
          aria-hidden="true"
          style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}
        >
          <label>
            <span>Website</span>
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
            />
          </label>
        </div>

        <div className="rounded-md border border-white/10 bg-black/20 p-3">
          <div className="flex items-baseline justify-between gap-4 mb-2">
            <span className="text-xs uppercase tracking-wide text-white/55">
              Quick check (proves you're human)
            </span>
            <button
              type="button"
              onClick={() => void loadChallenge()}
              className="text-xs text-white/55 underline-offset-2 hover:text-white/80 hover:underline"
            >
              New problem
            </button>
          </div>
          <p className="text-sm text-white/85 mb-2">{challengePromptText(challengeLoading, challenge)}</p>
          <input
            type="number"
            inputMode="numeric"
            required
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            maxLength={6}
            placeholder="Your answer"
            className="w-full rounded-md border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-primary focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={submitState === "submitting" || !challenge}
          className="rounded-md border border-primary/40 bg-primary/20 px-4 py-2 text-sm text-primary transition-colors hover:bg-primary/30 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitState === "submitting" ? "Posting..." : "Post comment"}
        </button>

        {message ? (
          <output
            className={`block text-sm ${submitState === "success" ? "text-green-400" : "text-red-400"}`}
          >
            {message}
          </output>
        ) : null}
      </form>
    </section>
  )
}
