"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export default function HomeLogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    try {
      await fetch("/api/home/logout", { method: "POST" })
      router.push("/home/login")
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="rounded-lg border border-white/30 bg-white/10 px-3 py-1.5 text-sm text-white transition hover:bg-white/20 disabled:opacity-60"
    >
      {loading ? "Signing out..." : "Sign out"}
    </button>
  )
}
