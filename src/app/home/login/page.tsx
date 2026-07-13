import { Suspense } from "react"

import HomeLoginForm from "./home-login-form"

export default function HomeLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-600 to-purple-800" />}>
      <HomeLoginForm />
    </Suspense>
  )
}
