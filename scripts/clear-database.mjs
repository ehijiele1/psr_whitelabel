/**
 * Clear all records from all Supabase tables.
 *
 * Uses the service role key to bypass RLS and delete all rows.
 * Run with: node scripts/clear-database.mjs
 */

import { createClient } from "@supabase/supabase-js"
import { config } from "dotenv"

// Load env vars from .env.production (Vercel)
config({ path: ".env.production" })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

/**
 * Tables to clear, in reverse-dependency order (children first).
 * IMPORTANT: This script does NOT truncate auth.users or storage.objects.
 * Run only on non-auth tables.
 */
const TABLES = [
  // Auth-related (must come before users-related)
  "security_audit_logs",
  "audit_logs",
  "activity",

  // Email
  "email_queue",
  "inbox",

  // Files
  "files",

  // Push
  "push_subscriptions",
  "notification_preferences",

  // Tickets
  "tickets",

  // Subscriptions
  "tenant_subscriptions",
  "subscription_plans",

  // Payments
  "payments",

  // Lease / ID
  "lease_agreements",
  "id_verifications",

  // Applications
  "applications",
  "applicants",

  // Unit charges
  "unit_charges",

  // Units
  "units",

  // Tenants
  "tenants",

  // Properties
  "properties",

  // Invitations
  "invitations",

  // Lease / message
  "messages",

  // Profiles (keep last - references auth.users)
  "profiles",
]

async function countRows(table) {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true })
  if (error) {
    console.error(`  count error: ${error.message}`)
    return null
  }
  return count
}

async function deleteAll(table) {
  // Use a filter that's always true (id is not null) to delete all rows
  const { error } = await supabase
    .from(table)
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000")
  return error
}

console.log("⚠️  WARNING: This will permanently delete ALL records from the database!")
console.log(`Target: ${SUPABASE_URL}\n`)

for (const table of TABLES) {
  process.stdout.write(`Clearing ${table}... `)
  try {
    const before = await countRows(table)
    const error = await deleteAll(table)
    const after = await countRows(table)
    if (error) {
      console.log(`❌ ERROR: ${error.message}`)
    } else {
      console.log(`✅ cleared (was ${before ?? "?"}, now ${after ?? 0})`)
    }
  } catch (err) {
    console.log(`❌ EXCEPTION: ${err.message}`)
  }
}

console.log("\n✅ Done. All user-data tables cleared.")
console.log("Note: auth.users, auth.sessions, and storage.objects were NOT touched.")
