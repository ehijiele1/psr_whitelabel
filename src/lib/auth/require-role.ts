import { NextResponse } from "next/server"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"

export type AllowedRole = "landlord" | "caretaker" | "tenant" | "applicant"

export type AuthResult =
  | { ok: true; user: User; role: string }
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
    .select("role")
    .eq("user_id", user.id)
    .single()

  const role = profile?.role ?? null

  if (!role || !allowedRoles.includes(role as AllowedRole)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    }
  }

  return { ok: true, user, role }
}
