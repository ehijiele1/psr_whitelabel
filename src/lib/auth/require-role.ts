import { NextResponse } from "next/server"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/clientFactory"

export type AllowedRole = "landlord" | "caretaker" | "tenant" | "applicant"

// Extended user type with profile data
export interface AuthUser extends User {
  role: string
  property_id?: string
}

export type AuthResult =
  | { ok: true; user: AuthUser; role: string }
  | { ok: false; response: NextResponse }

export async function requireRole(allowedRoles: AllowedRole[]): Promise<AuthResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, property_id")
    .eq("user_id", user.id)
    .single()

  const role = profile?.role ?? null

  if (!role || !allowedRoles.includes(role as AllowedRole)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    }
  }

  // Extend user with profile data
  const authUser: AuthUser = {
    ...user,
    role,
    property_id: profile?.property_id,
  }

  return { ok: true, user: authUser, role }
}
