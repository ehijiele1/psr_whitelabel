import { createClient as createBrowserClient } from "./browser"
import { sendInviteSms } from "@/lib/notifications/sms"
import { brand, generateInviteCode } from "@/lib/config"
import { randomBytes } from 'node:crypto'

// HTML escape function to prevent XSS in email templates
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Generate cryptographically secure token
function generateInvitationToken(): string {
  const bytes = randomBytes(16).toString('base64url')
  return `${generateInviteCode()}-${bytes.slice(0, 8)}`
}

export async function getInvitationByToken(token: string) {
  const supabase = createBrowserClient()
  const { data } = await supabase
    .from("invitations")
    .select("*")
    .eq("token", token)
    .maybeSingle()
  return data
}

export async function claimInvitation(token: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createBrowserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  const { data: invitation } = await supabase
    .from("invitations")
    .select("*")
    .eq("token", token)
    .eq("status", "pending")
    .maybeSingle()

  if (!invitation) return { success: false, error: "Invalid or expired invitation" }

  if (new Date(invitation.expires_at) < new Date()) {
    return { success: false, error: "Invitation has expired" }
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      role: invitation.role,
      phone: invitation.phone,
      payment_history: invitation.payment_history,
      migrated: true,
      verified_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)

  if (profileError) return { success: false, error: profileError.message }

  const { error: inviteError } = await supabase
    .from("invitations")
    .update({ status: "claimed", verified_at: new Date().toISOString() })
    .eq("id", invitation.id)

  if (inviteError) return { success: false, error: inviteError.message }

  return { success: true }
}

export async function createInvitation(data: {
  phone: string
  email?: string
  full_name?: string
  role?: string
  unit_id?: string
  property_id?: string
  payment_history?: unknown
  notes?: string
}): Promise<{ success: boolean; error?: string; id?: string; token?: string }> {
  const supabase = createBrowserClient()
  const { data: user } = await supabase.auth.getUser()
  if (!user.user) return { success: false, error: "Not authenticated" }

  // Generate cryptographically secure token
  const token = generateInvitationToken()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  // Sanitize user input to prevent XSS
  const sanitizedFullName = data.full_name ? escapeHtml(data.full_name) : "Tenant"
  const sanitizedNotes = data.notes ? escapeHtml(data.notes) : null

  const { data: invitation, error } = await supabase
    .from("invitations")
    .insert({
      phone: data.phone,
      email: data.email,
      full_name: sanitizedFullName,
      unit_id: data.unit_id,
      property_id: data.property_id,
      role: data.role || "tenant",
      payment_history: data.payment_history || [],
      notes: sanitizedNotes,
      status: "pending",
      token,
      sent_at: new Date().toISOString(),
      expires_at: expiresAt,
      invited_by: user.user.id,
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/invite?token=${token}`

  if (data.email) {
    try {
      await supabase.from("email_queue").insert({
        to: data.email,
        subject: `You're Invited! Join ${brand.name}`,
        html_body: `
            <div style="font-family: sans-serif; color: #333;">
              <h2>Welcome to ${brand.name}!</h2>
              <p>Dear ${sanitizedFullName},</p>
              <p>You have been invited to register for your tenant account.</p>
              <p><a href="${inviteUrl}">Click here to complete your registration</a></p>
              <p>This link expires in 7 days.</p>
            </div>
          `,
        text_body: `Welcome to ${brand.name}! Dear ${sanitizedFullName}, you have been invited to register for your tenant account. Click here to complete your registration: ${inviteUrl}. This link expires in 7 days.`,
        status: "pending",
        created_at: new Date().toISOString(),
        created_by: user.user.id,
      })
    } catch {
      console.warn("[Invitations] Failed to queue invitation email")
    }
  }

  await sendInviteSms(data.phone, sanitizedFullName, inviteUrl)

  return { success: true, id: invitation.id, token }
}

export async function getInvitations() {
  const supabase = createBrowserClient()
  const { data } = await supabase
    .from("invitations")
    .select("*, properties(name), units(name)")
    .order("created_at", { ascending: false })
  return data || []
}

export async function resendInvitation(id: string) {
  const supabase = createBrowserClient()
  const { data: invitation } = await supabase
    .from("invitations")
    .select("*")
    .eq("id", id)
    .single()

  if (!invitation) return { success: false, error: "Invitation not found" }

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite?token=${invitation.token}`

  await sendInviteSms(invitation.phone, invitation.full_name || "Tenant", inviteUrl)

  return { success: true }
}

export async function redeemInvitation(token: string) {
  const supabase = createBrowserClient()

  const { data: invitation } = await supabase
    .from("invitations")
    .select("*")
    .eq("token", token)
    .eq("status", "pending")
    .single()

  if (!invitation) return { success: false, error: "Invalid or expired invitation" }

  if (new Date(invitation.expires_at) < new Date()) {
    return { success: false, error: "Invitation has expired" }
  }

  return { success: true, data: invitation }
}

export async function acceptInvitation(token: string) {
  const supabase = createBrowserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  const result = await redeemInvitation(token)
  if (!result.success) return result

  const { error: inviteError } = await supabase
    .from("invitations")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
      user_id: user.id,
    })
    .eq("token", token)

  if (inviteError) return { success: false, error: inviteError.message }

  const { error: unitError } = await supabase
    .from("units")
    .update({ status: "occupied" })
    .eq("id", result.data!.unit_id)

  if (unitError) return { success: false, error: unitError.message }

  return { success: true }
}
