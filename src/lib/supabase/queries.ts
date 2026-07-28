import { createClient, createBrowserClient } from "./clientFactory"
import type { PaginationParams, PaginatedResponse } from "@/lib/pagination"
import { paginatedQuery, parsePaginationParams } from "@/lib/pagination"

export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getProfile() {
  const supabase = await createClient()
  const user = await getUser()
  if (!user) return null

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single()

  return data
}

export async function getUserRole(): Promise<string | null> {
  const supabase = await createClient()
  const user = await getUser()
  if (!user) return null

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single()

  return data?.role || null
}

export async function isAdminRole(role: string | null): Promise<boolean> {
  if (!role) return false
  return ["landlord", "caretaker"].includes(role)
}

export async function isTenantRole(role: string | null): Promise<boolean> {
  if (!role) return false
  return ["tenant"].includes(role)
}

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

// Backward compatible version for existing code
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

// Backward compatible version for existing code
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

// Backward compatible version for existing code
export async function getPaymentsLegacy() {
  const result = await getPayments({ page: 1, pageSize: 1000 })
  return result.data
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

// Backward compatible version for existing code
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

// Backward compatible version for existing code
export async function getTenantTicketsLegacy(tenantId: string) {
  const result = await getTenantTickets(tenantId, { page: 1, pageSize: 1000 })
  return result.data
}

export async function getApplications(params?: PaginationParams): Promise<PaginatedResponse<any>> {
  const supabase = await createClient()
  const paginationParams = params || parsePaginationParams({})
  
  return paginatedQuery(
    supabase,
    "applications",
    "*, profiles(full_name, email, phone)",
    paginationParams,
    (query: any) => query.order("submitted_at", { ascending: false })
  )
}

// Backward compatible version for existing code
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

export async function getDashboardStats() {
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
}

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

// Backward compatible version for existing code
export async function getInvitationsLegacy() {
  const result = await getInvitations({ page: 1, pageSize: 1000 })
  return result.data
}
