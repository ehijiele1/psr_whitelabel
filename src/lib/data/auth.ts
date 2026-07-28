/**
 * Auth & profile-related queries.
 */

import { createClient } from "../supabase/clientFactory"

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
