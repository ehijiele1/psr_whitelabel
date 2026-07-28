import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  
  // Skip middleware for static files and API routes
  const isStaticFile = /\.(?:svg|png|jpg|jpeg|gif|webp|ico|json)$/.test(path)
  const isApiRoute = path.startsWith("/api")
  const isAuthCallback = path.startsWith("/auth/callback")
  
  if (isStaticFile || isApiRoute || isAuthCallback) {
    return NextResponse.next()
  }

  // Initialize Supabase client with cookie handling
  let supabaseResponse = NextResponse.next({ request })
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session and get user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Define route patterns
  const isDashboard = path.startsWith("/dashboard")
  const isAuthRoute = path.startsWith("/login") || path.startsWith("/register") || path.startsWith("/setup")
  const isResetPassword = path === "/reset-password"
  const isInvite = path.startsWith("/invite")
  const isOnboarding = path.startsWith("/onboarding")

  // Allow recovery sessions to access reset-password
  if (isResetPassword && user) {
    return supabaseResponse
  }

  // Redirect unauthenticated users to login
  if (!user) {
    if (isDashboard || isOnboarding) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // Redirect authenticated users away from auth pages (but not reset-password or invite)
  if (user && (isAuthRoute || isResetPassword)) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  // Role-based access control for dashboard routes
  if (user && isDashboard) {
    // Get user role from profiles table
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single()

    if (error || !profile) {
      // If no profile exists, redirect to onboarding or setup
      const url = request.nextUrl.clone()
      url.pathname = "/setup"
      return NextResponse.redirect(url)
    }

    const userRole = profile.role
    
    // Define role-specific dashboard paths
    const rolePaths = {
      landlord: ["/dashboard", "/dashboard/landlord"],
      caretaker: ["/dashboard", "/dashboard/caretaker"],
      tenant: ["/dashboard", "/dashboard/tenant"],
      applicant: ["/onboarding"],
    }

    // Check if user is trying to access a path they shouldn't
    const landlordPaths = ["/dashboard/landlord", "/dashboard/staff", "/dashboard/properties", "/dashboard/payments", "/dashboard/reports", "/dashboard/settings"]
    const caretakerPaths = ["/dashboard/caretaker", "/dashboard/tenants", "/dashboard/tickets", "/dashboard/messages"]
    const tenantPaths = ["/dashboard/tenant", "/dashboard/applications"]

    if (userRole === "tenant" && landlordPaths.some(p => path.startsWith(p))) {
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard/tenant"
      return NextResponse.redirect(url)
    }

    if (userRole === "tenant" && caretakerPaths.some(p => path.startsWith(p))) {
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard/tenant"
      return NextResponse.redirect(url)
    }

    if (userRole === "caretaker" && landlordPaths.some(p => path.startsWith(p))) {
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard/caretaker"
      return NextResponse.redirect(url)
    }

    if (userRole === "caretaker" && tenantPaths.some(p => path.startsWith(p))) {
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard/caretaker"
      return NextResponse.redirect(url)
    }

    if (userRole === "landlord" && tenantPaths.some(p => path.startsWith(p))) {
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard/landlord"
      return NextResponse.redirect(url)
    }

    if (userRole === "landlord" && caretakerPaths.some(p => path.startsWith(p))) {
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard/landlord"
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|sw.js|workbox-*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
