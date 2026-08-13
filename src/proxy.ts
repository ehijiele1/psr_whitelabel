import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { ensureCsrfToken } from "@/lib/csrf"

function withCsrf(request: NextRequest, response: NextResponse): NextResponse {
  ensureCsrfToken(request, response)
  return response
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Pass through static files, icons, service-worker assets, and auth callbacks
  // early — before we touch cookies or make any Supabase calls.
  const isPassThrough =
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|js|css|woff2?)$/.test(path) ||
    path.startsWith("/auth/callback") ||
    path.startsWith("/_next")

  if (isPassThrough) return NextResponse.next()

  // ── Cookie-aware Supabase client ─────────────────────────────────────────
  // We must propagate any refreshed session cookies from Supabase back to
  // both the request (for downstream middleware) and the response (for the
  // browser). Build an intermediate response that we update inside setAll.

  const requestHeaders = new Headers(request.headers)
  let response = NextResponse.next({ request: { headers: requestHeaders } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Reflect refreshed cookies on the outgoing request headers so
          // server components see the updated session immediately.
          cookiesToSet.forEach(({ name, value }) =>
            requestHeaders.set(`cookie`, `${name}=${value}`)
          )
          // Rebuild the response so we can set cookies on it.
          response = NextResponse.next({ request: { headers: requestHeaders } })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // ── Auth check ───────────────────────────────────────────────────────────
  // getUser() validates the JWT server-side (no DB round-trip for auth itself).
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isDashboard = path.startsWith("/dashboard")
  const isAuthRoute =
    path.startsWith("/login") ||
    path.startsWith("/register") ||
    path.startsWith("/setup")
  const isResetPassword = path === "/reset-password"
  const isOnboarding = path.startsWith("/onboarding")

  // Allow authenticated users to access the reset-password page.
  if (isResetPassword && user) return withCsrf(request, response)

  // Redirect unauthenticated users trying to access protected routes.
  if (!user) {
    if (isDashboard || isOnboarding) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      return withCsrf(request, NextResponse.redirect(url))
    }
    return withCsrf(request, response)
  }

  // Redirect already-authenticated users away from auth pages.
  if (user && (isAuthRoute || isResetPassword)) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return withCsrf(request, NextResponse.redirect(url))
  }

  // ── Role-based access control for dashboard routes ───────────────────────
  if (isDashboard) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single()

    if (error || !profile) {
      // No profile — send to setup wizard.
      const url = request.nextUrl.clone()
      url.pathname = "/setup"
      return withCsrf(request, NextResponse.redirect(url))
    }

    const userRole = profile.role as string

    // ── Forward role to Server Components via request header ─────────────
    // Server Components read this with `headers().get('x-user-role')` and
    // skip their own DB lookup, saving one round-trip per dashboard page.
    response.headers.set("x-user-role", userRole)

    // ── Path-based role enforcement ───────────────────────────────────────
    const landlordOnly = [
      "/dashboard/staff",
      "/dashboard/properties",
      "/dashboard/payments",
      "/dashboard/reports",
      "/dashboard/settings",
    ]
    const caretakerAndLandlord = [
      "/dashboard/tenants",
      "/dashboard/tickets",
      "/dashboard/messages",
    ]

    const fallbackForRole: Record<string, string> = {
      landlord: "/dashboard",
      caretaker: "/dashboard",
      tenant: "/dashboard",
    }
    const fallback = fallbackForRole[userRole] ?? "/dashboard"

    if (userRole === "tenant") {
      const blocked = [...landlordOnly, ...caretakerAndLandlord]
      if (blocked.some((p) => path.startsWith(p))) {
        const url = request.nextUrl.clone()
        url.pathname = fallback
        return withCsrf(request, NextResponse.redirect(url))
      }
    }

    if (userRole === "caretaker") {
      if (landlordOnly.some((p) => path.startsWith(p))) {
        const url = request.nextUrl.clone()
        url.pathname = fallback
        return withCsrf(request, NextResponse.redirect(url))
      }
    }
  }

  return withCsrf(request, response)
}

export const config = {
  matcher: [
    // Match all paths except Next.js internals and known static extensions.
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|sw.js|workbox-.*|swe-worker-.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
}
