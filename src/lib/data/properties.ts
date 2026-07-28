/**
 * Property-related queries.
 */

import { createClient } from "../supabase/clientFactory"
import type { PaginationParams, PaginatedResponse } from "@/lib/pagination"
import { paginatedQuery, parsePaginationParams } from "@/lib/pagination"

export async function getProperties(params?: PaginationParams): Promise<PaginatedResponse<any>> {
  const supabase = await createClient()
  const paginationParams = params || parsePaginationParams({})

  return paginatedQuery(
    supabase,
    "properties",
    "*, units(count), tenants!inner(count)",
    paginationParams,
    (query: any) => query.order("created_at", { ascending: false })
  )
}

/** Backward compatible version for existing code (returns all data, no pagination metadata). */
export async function getPropertiesLegacy() {
  const result = await getProperties({ page: 1, pageSize: 1000 })
  return result.data
}

export async function getProperty(id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("properties")
    .select("*, units(*), tenants(*, profiles(full_name, email, phone))")
    .eq("id", id)
    .single()
  return data
}
