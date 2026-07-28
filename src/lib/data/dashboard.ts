/**
 * Dashboard aggregate queries (stats, summary data).
 */

import { cache } from "react"
import { createClient } from "../supabase/clientFactory"

/**
 * Dashboard statistics - per-request memoized via React cache().
 * Within a single server render, multiple calls share one DB hit.
 * Across requests, results are fresh (no stale data).
 * For longer TTL caching across requests, use unstable_cache() in the route.
 */
export const getDashboardStats = cache(async () => {
  const supabase = await createClient()
  const [properties, tenants, payments] = await Promise.all([
    supabase.from("properties").select("id", { count: "exact", head: true }),
    supabase.from("tenants").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("payments").select("amount").eq("status", "approved"),
  ])

  const totalRevenue = (payments.data || []).reduce((sum: number, p: { amount: number }) => sum + (p.amount || 0), 0)

  return {
    totalProperties: properties.count || 0,
    activeTenants: tenants.count || 0,
    totalRevenue,
  }
})
