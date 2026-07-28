/**
 * Application queries (tenant applications).
 */

import { createBrowserClient } from "../supabase/clientFactory"
import type { PaginationParams, PaginatedResponse } from "@/lib/pagination"
import { paginatedQuery, parsePaginationParams } from "@/lib/pagination"

export async function getApplications(params?: PaginationParams): Promise<PaginatedResponse<any>> {
  const supabase = await createBrowserClient()
  const paginationParams = params || parsePaginationParams({})

  return paginatedQuery(
    supabase,
    "applications",
    "*, profiles(full_name, email, phone)",
    paginationParams,
    (query: any) => query.order("submitted_at", { ascending: false })
  )
}

/** Backward compatible version for existing code (returns all data, no pagination metadata). */
export async function getApplicationsLegacy() {
  const result = await getApplications({ page: 1, pageSize: 1000 })
  return result.data
}

export async function submitApplication(
  formData: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createBrowserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  const { error } = await supabase.from("applications").insert({
    user_id: user.id,
    form_data: formData,
    status: "pending",
    submitted_at: new Date().toISOString(),
  })

  if (error) return { success: false, error: error.message }
  return { success: true }
}
