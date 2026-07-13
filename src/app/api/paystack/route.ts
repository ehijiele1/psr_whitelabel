import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import crypto from "node:crypto"
import { sendPaymentConfirmation } from "@/lib/notifications/sms"

function verifyPaystackSignature(body: string, signature: string, secret: string): boolean {
  const hash = crypto.createHmac("sha256", secret).update(body).digest("hex")
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature))
}

export async function POST(request: Request) {
  try {
    const signature = request.headers.get("x-paystack-signature")
    const secret = process.env.PAYSTACK_SECRET_KEY

    if (!secret) {
      console.error("PAYSTACK_SECRET_KEY is not configured")
      return NextResponse.json({ status: "error", message: "Webhook not configured" }, { status: 500 })
    }

    if (!signature) {
      return NextResponse.json({ status: "error", message: "Missing signature" }, { status: 401 })
    }

    const body = await request.text()

    if (!verifyPaystackSignature(body, signature, secret)) {
      return NextResponse.json({ status: "error", message: "Invalid signature" }, { status: 401 })
    }

    const parsed = JSON.parse(body)
    const { event, data } = parsed

    if (event !== "charge.success") {
      return NextResponse.json({ status: "ignored" })
    }

    const supabase = await createClient()

    const { metadata } = data
    const tenantId = metadata?.tenant_id
    const propertyId = metadata?.property_id
    const amount = data.amount / 100
    const reference = data.reference

    if (!tenantId || !propertyId) {
      return NextResponse.json({ status: "error", message: "Missing metadata" }, { status: 400 })
    }

    const { data: paymentData } = await supabase
      .from("payments")
      .insert({
        tenant_id: tenantId,
        property_id: propertyId,
        amount,
        type: "rent",
        cycle_start: metadata?.cycle_start,
        cycle_end: metadata?.cycle_end,
        method: "paystack",
        reference,
        status: "approved",
        approved_at: new Date().toISOString(),
      })
      .select("id")
      .single()

    await supabase.from("notifications").insert({
      user_id: tenantId,
      type: "payment",
      title: "Payment Received",
      message: `Payment of ₦${amount.toLocaleString()} (Ref: ${reference}) has been confirmed.`,
      channel: "in_app",
      status: "sent",
      sent_at: new Date().toISOString(),
    })

    const { data: tenantRecord } = await supabase
      .from("tenants")
      .select("user_id")
      .eq("id", tenantId)
      .single()

    if (tenantRecord) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("phone, full_name")
        .eq("id", tenantRecord.user_id)
        .single()

      if (profile) {
        const { data: receiptData } = await supabase
          .rpc("generate_receipt_number", { p_type: "rent" })

        if (receiptData) {
          await supabase.from("receipts").insert({
            receipt_number: receiptData,
            payment_id: paymentData?.id,
            tenant_id: tenantId,
            receipt_type: "rent",
            amount,
          })
        }

        if (profile.phone) {
          await sendPaymentConfirmation(profile.phone, profile.full_name || "Tenant", amount, reference)
        }
      }
    }

    return NextResponse.json({ status: "success" })
  } catch (err) {
    console.error("Paystack webhook error:", err)
    return NextResponse.json({ status: "error", message: "Internal error" }, { status: 500 })
  }
}
