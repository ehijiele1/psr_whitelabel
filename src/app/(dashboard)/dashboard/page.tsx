// Server Component — no "use client".
// The middleware already authenticated the user and attached x-user-role to
// the request headers, so we read the role directly without a second DB call.
// If the header is absent (e.g. direct server-side render without middleware)
// we fall back to a Supabase query so the page always works correctly.

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/clientFactory"
import LandlordDashboard from "./landlord-view"
import CaretakerDashboard from "./caretaker-view"
import TenantDashboard from "./tenant-view"

export default async function DashboardPage() {
  const headersList = await headers()
  let role = headersList.get("x-user-role")

  // Fallback: read role from DB when the middleware header is unavailable.
  if (!role) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect("/login")

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single()

    role = profile?.role ?? null
  }

  if (role === "landlord") return <LandlordDashboard />
  if (role === "caretaker") return <CaretakerDashboard />
  return <TenantDashboard />
}
