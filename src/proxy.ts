import { NextResponse, type NextRequest } from "next/server"

import { HOME_SESSION_COOKIE, verifySession } from "@/lib/home-auth"

const REALM = "forthelols"
const HOME_HOST = "home.adentranter.com"

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }
  let mismatch = 0
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= (a.codePointAt(i) ?? 0) ^ (b.codePointAt(i) ?? 0)
  }
  return mismatch === 0
}

function decodeBasicAuth(header: string): { user: string; pass: string } | null {
  if (!header.toLowerCase().startsWith("basic ")) {
    return null
  }
  const encoded = header.slice(6).trim()
  try {
    const decoded = atob(encoded)
    const idx = decoded.indexOf(":")
    if (idx === -1) {
      return null
    }
    return { user: decoded.slice(0, idx), pass: decoded.slice(idx + 1) }
  } catch {
    return null
  }
}

function unauthorized(): NextResponse {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${REALM}", charset="UTF-8"`,
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  })
}

function isHomePath(pathname: string): boolean {
  return pathname === "/home" || pathname.startsWith("/home/")
}

function isPublicHomePath(pathname: string): boolean {
  return pathname === "/home/login"
}

function isAdminPath(pathname: string): boolean {
  return pathname === "/forthelols" || pathname.startsWith("/forthelols/") || pathname.startsWith("/api/admin/")
}

function resolveHomePathname(pathname: string, isHomeHost: boolean): string {
  if (!isHomeHost || pathname.startsWith("/home")) {
    return pathname
  }
  return pathname === "/" ? "/home" : `/home${pathname}`
}

function handleAdminAuth(request: NextRequest): NextResponse {
  const expectedUser = process.env.ADMIN_USERNAME
  const expectedPass = process.env.ADMIN_PASSWORD

  if (!expectedUser || !expectedPass) {
    return new NextResponse(
      "Admin is not configured. Set ADMIN_USERNAME and ADMIN_PASSWORD.",
      { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } }
    )
  }

  const credentials = decodeBasicAuth(request.headers.get("authorization") ?? "")
  if (!credentials) {
    return unauthorized()
  }

  const userOk = constantTimeEqual(credentials.user, expectedUser)
  const passOk = constantTimeEqual(credentials.pass, expectedPass)
  if (!userOk || !passOk) {
    return unauthorized()
  }

  return NextResponse.next()
}

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl

  if (isAdminPath(pathname)) {
    return handleAdminAuth(request)
  }

  const host = request.headers.get("host")?.split(":")[0] ?? ""
  const isHomeHost = host === HOME_HOST
  const effectivePathname = resolveHomePathname(pathname, isHomeHost)

  if (isHomeHost && !pathname.startsWith("/home")) {
    const url = request.nextUrl.clone()
    url.pathname = effectivePathname
    return NextResponse.rewrite(url)
  }

  const needsAuth = isHomePath(effectivePathname) && !isPublicHomePath(effectivePathname)

  if (needsAuth) {
    const session = request.cookies.get(HOME_SESSION_COOKIE)?.value
    if (!verifySession(session)) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = "/home/login"
      loginUrl.searchParams.set("next", effectivePathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/home", "/home/:path*", "/forthelols", "/forthelols/:path*", "/api/admin/:path*"],
}
