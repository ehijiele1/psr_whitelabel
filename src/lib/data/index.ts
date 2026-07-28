/**
 * Domain data access layer.
 * Re-exports all data functions for backward compatibility with imports
 * that previously came from `@/lib/supabase/queries`.
 *
 * New code should import directly from the specific domain module:
 *   import { getTenants } from "@/lib/data/tenants"
 */

// Auth & profiles
export * from "./auth"

// Properties
export * from "./properties"

// Tenants (includes tenant payments & tickets)
export * from "./tenants"

// Payments
export * from "./payments"

// Applications
export * from "./applications"

// Invitations
export * from "./invitations"

// Dashboard
export * from "./dashboard"
