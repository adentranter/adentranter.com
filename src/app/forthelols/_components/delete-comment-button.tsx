"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface DeleteCommentButtonProps {
  readonly commentId: string
}

export function DeleteCommentButton({ commentId }: DeleteCommentButtonProps) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    if (pending) return
    if (!globalThis.confirm("Delete this comment? This can't be undone.")) {
      return
    }
    setPending(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/comments/${commentId}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error || "Could not delete comment.")
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete comment.")
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="rounded-md border border-red-500/40 bg-red-500/10 px-2 py-1 text-xs text-red-300 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Deleting..." : "Delete"}
      </button>
      {error ? <span className="text-xs text-red-400">{error}</span> : null}
    </div>
  )
}
