/**
 * Tenant and tenant-related queries (payments, tickets).
 */

import { createClient } from "../supabase/clientFactory"
import type { PaginationParams, PaginatedResponse } from "@/lib/pagination"
import { paginatedQuery, parsePaginationParams } from "@/lib/pagination"

export async function getTenants(params?: PaginationParams): Promise<PaginatedResponse<any>> {
  const supabase = await createClient()
  const paginationParams = params || parsePaginationParams({})

  return paginatedQuery(
    supabase,
    "tenants",
    "*, profiles(full_name, email, phone), units(name, monthly_rent), properties(name)",
    paginationParams,
    (query: any) => query.order("created_at", { ascending: false })
  )
}

/** Backward compatible version for existing code (returns all data, no pagination metadata). */
export async function getTenantsLegacy() {
  const result = await getTenants({ page: 1, pageSize: 1000 })
  return result.data
}

export async function getTenant(id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("tenants")
    .select("*, profiles(full_name, email, phone), units(*), properties(*), payments(*), tickets(*)")
    .eq("id", id)
    .single()
  return data
}

export async function getTenantPayments(tenantId: string, params?: PaginationParams): Promise<PaginatedResponse<any>> {
  const supabase = await createClient()
  const paginationParams = params || parsePaginationParams({})

  return paginatedQuery(
    supabase,
    "payments",
    "*, tenants!inner(profiles(full_name), units(name))",
    paginationParams,
    (query: any) => query.eq("tenant_id", tenantId).order("created_at", { ascending: false })
  )
}

/** Backward compatible version for existing code (returns all data, no pagination metadata). */
export async function getTenantPaymentsLegacy(tenantId: string) {
  const result = await getTenantPayments(tenantId, { page: 1, pageSize: 1000 })
  return result.data
}

export async function getTenantTickets(tenantId: string, params?: PaginationParams): Promise<PaginatedResponse<any>> {
  const supabase = await createClient()
  const paginationParams = params || parsePaginationParams({})

  return paginatedQuery(
    supabase,
    "tickets",
    "*, units(name)",
    paginationParams,
    (query: any) => query.eq("tenant_id", tenantId).order("created_at", { ascending: false })
  )
}

/** Backward compatible version for existing code (returns all data, no pagination metadata). */
export async function getTenantTicketsLegacy(tenantId: string) {
  const result = await getTenantTickets(tenantId, { page: 1, pageSize: 1000 })
  return result.data
}
