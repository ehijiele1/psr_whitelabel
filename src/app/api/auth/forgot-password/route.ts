import { NextResponse, NextRequest } from "next/server"
import { rateLimit, getIP } from "@/lib/rateLimiter"
import { createAdminClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/emails/email"
import { env } from "@/lib/env"

export async function POST(req: NextRequest) {
  // Rate limiting: 5 requests per minute per IP (prevent email spam)
  const ip = getIP(req)
  if (!rateLimit(ip, 5, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 })
  }

  try {
    const { email } = await req.json()
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    const redirectTo = `${env.appUrl}/auth/callback?next=/reset-password`

    const admin = await createAdminClient()
    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo },
    })

    if (error || !data?.properties?.action_link) {
      return NextResponse.json({ error: "Failed to generate reset link" }, { status: 500 })
    }

    const resetLink = data.properties.action_link

    const result = await sendEmail({
      to: email,
      subject: "Reset your PrinceSteve Residence password",
      html: `
        <div style="font-family: sans-serif; color: #333; max-width: 480px; margin: 0 auto;">
          <div style="background: #0F172A; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: #fff; margin: 0; font-size: 20px;">PrinceSteve Residence</h1>
          </div>
          <div style="padding: 24px; border: 1px solid #e2e8f0; border-radius: 0 0 12px 12px;">
            <h2 style="margin: 0 0 12px; font-size: 18px;">Password Reset Request</h2>
            <p style="margin: 0 0 16px; color: #64748b; font-size: 14px; line-height: 1.5;">
              We received a request to reset the password for your PrinceSteve Residence account.
              Click the button below to set a new password. This link expires in 1 hour.
            </p>
            <a href="${resetLink}"
               style="display: inline-block; background: #0F172A; color: #fff; text-decoration: none;
                      padding: 12px 32px; border-radius: 8px; font-size: 14px; font-weight: 600;">
              Reset Password
            </a>
            <p style="margin: 16px 0 0; color: #94a3b8; font-size: 12px;">
              If you didn't request this, you can safely ignore this email.
            </p>
            <p style="margin: 8px 0 0; color: #94a3b8; font-size: 12px;">
              Or copy this link into your browser:<br/>
              <a href="${resetLink}" style="color: #0F172A; word-break: break-all;">${resetLink}</a>
            </p>
          </div>
        </div>
      `,
    })

    if (!result.ok) {
      return NextResponse.json({ error: result.error || "Failed to send email" }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
