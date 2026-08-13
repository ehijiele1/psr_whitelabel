import crypto from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/clientFactory"
import { setupSchema, validateSchema } from "@/lib/schemas"
import { csrfProtection } from "@/lib/csrf"
import { rateLimit, getIP } from "@/lib/rateLimiter"

export async function POST(req: NextRequest) {
  try {
    // CSRF: setup creates the owner account, so require a valid token.
    const csrfResult = await csrfProtection(req)
    if (!csrfResult.valid) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 })
    }

    // Rate limit setup attempts per IP to slow down first-run hijacking.
    const ip = getIP(req)
    const rateLimitResult = await rateLimit(ip, 10, 60_000)
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 })
    }

    const body = await req.json()
    
    // Validate using Zod schema
    const validation = validateSchema(setupSchema, body);
    if (!validation.success || !validation.data) {
      return NextResponse.json({ error: validation.error || 'Invalid data' }, { status: 400 });
    }

    const { account, property, unitGroups } = validation.data;

    // Use admin client for setup - this is justified as it needs to create the first user
    const admin = await createAdminClient()

    // Authorization: setup is only allowed when no landlord exists yet,
    // OR when a valid SETUP_SECRET token is supplied via header.
    const { count: landlordCount, error: countError } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "landlord")

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 })
    }

    if ((landlordCount ?? 0) > 0) {
      const setupSecret = process.env.SETUP_SECRET
      const provided = req.headers.get("x-setup-secret")
      if (!setupSecret || !provided || provided !== setupSecret) {
        return NextResponse.json(
          { error: "Setup is already complete" },
          { status: 403 }
        )
      }
    }

    // 1. Create owner auth account using admin API
    const { data: createData, error: createError } = await admin.auth.admin.createUser({
      email: account.email,
      password: account.password,
      email_confirm: true,
      user_metadata: {
        full_name: account.fullName,
        phone: account.phone,
        role: "landlord",
        is_admin_created: true,
      },
    })

    if (createError || !createData.user?.id) {
      return NextResponse.json({ error: createError?.message || "Failed to create account" }, { status: 500 })
    }

    const ownerId = createData.user.id

    // 2. Create profile
    const { error: profileError } = await admin.from("profiles").upsert({
      id: ownerId,
      user_id: ownerId,
      full_name: account.fullName,
      phone: account.phone,
      email: account.email,
      role: "landlord",
    })

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    // 3. Insert property
    const { data: propData, error: propError } = await admin
      .from("properties")
      .insert({
        name: property.name,
        address: property.address,
        type: property.type || "Residential",
        landlord_id: ownerId,
        status: "active",
        rent_collection: property.rentCollection || "automatic",
      })
      .select("id")
      .single()

    if (propError || !propData) {
      return NextResponse.json({ error: propError?.message || "Failed to create property" }, { status: 500 })
    }

    const propertyId = propData.id

    // 4. Insert all units with their charges
    const unitRows: Record<string, unknown>[] = []
    const chargeRows: Record<string, unknown>[] = []

    for (const group of unitGroups || []) {
      for (const unit of group.units || []) {
        if (!unit.monthlyRent || parseFloat(unit.monthlyRent) <= 0) continue

        const unitId = crypto.randomUUID()
        unitRows.push({
          id: unitId,
          property_id: propertyId,
          name: unit.name,
          type: group.type,
          status: "available",
          monthly_rent: parseFloat(unit.monthlyRent),
          deposit_amount: unit.deposit ? parseFloat(unit.deposit) : null,
        })

        const today = new Date().toISOString().split("T")[0]

        if (group.lawma && parseFloat(group.lawma) > 0) {
          chargeRows.push({
            unit_id: unitId,
            charge_type: "lawma",
            amount: parseFloat(group.lawma),
            effective_from: today,
          })
        }

        if (group.type === "apartment" && group.sanitation && parseFloat(group.sanitation) > 0) {
          chargeRows.push({
            unit_id: unitId,
            charge_type: "sanitation",
            amount: parseFloat(group.sanitation),
            effective_from: today,
          })
        }

        if (group.type === "apartment" && unit.luc && parseFloat(unit.luc) > 0) {
          chargeRows.push({
            unit_id: unitId,
            charge_type: "luc",
            amount: parseFloat(unit.luc),
            effective_from: today,
          })
        }
      }
    }

    if (unitRows.length > 0) {
      const { error: unitError } = await admin.from("units").insert(unitRows)
      if (unitError) {
        return NextResponse.json({ error: unitError.message }, { status: 500 })
      }
    }

    if (chargeRows.length > 0) {
      const { error: chargeError } = await admin.from("unit_charges").insert(chargeRows)
      if (chargeError) {
        return NextResponse.json({ error: chargeError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[Setup] Error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "An unexpected error occurred" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const admin = await createAdminClient()
    const { count, error } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "landlord")

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ complete: (count ?? 0) > 0 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
