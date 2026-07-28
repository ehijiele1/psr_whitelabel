/**
 * Invitation queries.
 */

import { createClient } from "../supabase/clientFactory"
import type { PaginationParams, PaginatedResponse } from "@/lib/pagination"
import { paginatedQuery, parsePaginationParams } from "@/lib/pagination"

export async function getInvitations(params?: PaginationParams): Promise<PaginatedResponse<any>> {
  const supabase = await createClient()
  const paginationParams = params || parsePaginationParams({})

  return paginatedQuery(
    supabase,
    "invitations",
    "*, properties(name), units(name)",
    paginationParams,
    (query: any) => query.order("created_at", { ascending: false })
  )
}

/** Backward compatible version for existing code (returns all data, no pagination metadata). */
export async function getInvitationsLegacy() {
  const result = await getInvitations({ page: 1, pageSize: 1000 })
  return result.data
}
