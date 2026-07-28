/**
 * Payment queries.
 */

import { createClient } from "../supabase/clientFactory"
import type { PaginationParams, PaginatedResponse } from "@/lib/pagination"
import { paginatedQuery, parsePaginationParams } from "@/lib/pagination"

export async function getPayments(params?: PaginationParams): Promise<PaginatedResponse<any>> {
  const supabase = await createClient()
  const paginationParams = params || parsePaginationParams({})

  return paginatedQuery(
    supabase,
    "payments",
    "*, tenants!inner(profiles(full_name), units(name))",
    paginationParams,
    (query: any) => query.order("created_at", { ascending: false })
  )
}

/** Backward compatible version for existing code (returns all data, no pagination metadata). */
export async function getPaymentsLegacy() {
  const result = await getPayments({ page: 1, pageSize: 1000 })
  return result.data
}
