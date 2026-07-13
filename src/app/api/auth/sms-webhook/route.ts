import { NextResponse } from "next/server"

const WEBHOOK_API_KEY = process.env.SMS_WEBHOOK_API_KEY || ""

export async function POST(request: Request) {
  try {
    const apiKey = request.headers.get("x-api-key")
    if (!apiKey || apiKey !== WEBHOOK_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { phone, message } = await request.json()

    if (!phone || !message) {
      return NextResponse.json({ error: "Phone and message are required" }, { status: 400 })
    }

    if (typeof phone !== "string" || typeof message !== "string") {
      return NextResponse.json({ error: "Invalid request format" }, { status: 400 })
    }

    if (message.length > 612) {
      return NextResponse.json({ error: "Message too long" }, { status: 400 })
    }

    const cleanPhone = phone.replace(/[+\s\-()]/g, "")

    const username = process.env.EBULK_SMS_USERNAME || ""
    const apiKeyValue = process.env.EBULK_SMS_API_KEY || ""

    if (!username || !apiKeyValue) {
      console.error("eBulkSMS not configured")
      return NextResponse.json({ error: "SMS service not configured" }, { status: 500 })
    }

    const response = await fetch("https://api.ebulksms.com/sendsms.json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        SMS: {
          auth: {
            username,
            apikey: apiKeyValue,
          },
          message: {
            sender: "PrinceSteve",
            messagetext: message,
            flash: "0",
          },
          recipients: {
            gsm: [{ msidn: cleanPhone, msgid: `OTP-${Date.now().toString(36)}` }],
          },
        },
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      console.error("eBulkSMS error:", text)
      return NextResponse.json({ error: "Failed to send SMS" }, { status: 502 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("SMS webhook error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
