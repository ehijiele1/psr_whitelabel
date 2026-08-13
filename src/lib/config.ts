// ─────────────────────────────────────────────────────────────────────────────
// White-label brand & product configuration.
//
// Every value in this file has a safe, neutral default that can be overridden
// per deployment via environment variables. Because this product is meant to be
// sold and white-labelled, no personal or deployment-specific details are
// hardcoded anywhere in the application — branding lives here (or in env).
//
// NEXT_PUBLIC_* values are safe to reference from client components: Next.js
// inlines them at build time. Keep brand fields public; keep secrets in
// server-only env vars.
// ─────────────────────────────────────────────────────────────────────────────

function pick(key: string, fallback: string): string {
  const value = process.env[key]
  return value && value.trim().length > 0 ? value.trim() : fallback
}

export const brand = {
  // Display name shown across the UI and in emails/SMS.
  name: pick("NEXT_PUBLIC_BRAND_NAME", "EstateManager"),

  // Short monogram / abbreviated name (app icon, apple-web-app title).
  shortName: pick("NEXT_PUBLIC_BRAND_SHORT_NAME", "EM"),

  // One-line tagline for the marketing landing page.
  tagline: pick("NEXT_PUBLIC_BRAND_TAGLINE", "Property Management, Made Simple"),

  // Meta description used by search engines and social previews.
  description: pick(
    "NEXT_PUBLIC_BRAND_DESCRIPTION",
    "Secure multi-role property management platform for landlords, caretakers and tenants."
  ),

  // Support contact details surfaced in emails, SMS and the landing footer.
  supportEmail: pick("NEXT_PUBLIC_BRAND_SUPPORT_EMAIL", "support@estatemanager.app"),
  supportPhone: pick("NEXT_PUBLIC_BRAND_SUPPORT_PHONE", ""),
  supportAddress: pick("NEXT_PUBLIC_BRAND_SUPPORT_ADDRESS", ""),

  // Legal entity name used in tenancy agreements and the footer copyright.
  legalName: pick("NEXT_PUBLIC_BRAND_LEGAL_NAME", "EstateManager"),

  // Currency configuration for all monetary display and payment flows.
  currencyCode: pick("NEXT_PUBLIC_BRAND_CURRENCY", "NGN"),
  currencySymbol: pick("NEXT_PUBLIC_BRAND_CURRENCY_SYMBOL", "₦"),
  locale: pick("NEXT_PUBLIC_BRAND_LOCALE", "en-NG"),

  // PWA theme color (also drives the <meta name="theme-color"> tag).
  themeColor: pick("NEXT_PUBLIC_BRAND_THEME_COLOR", "#0F172A"),

  // Tenancy agreement template placeholders (used in the tenant application
  // wizard and generated agreements). Override per deployment.
  landlordName: pick(
    "NEXT_PUBLIC_BRAND_LANDLORD_NAME",
    "The Landlord"
  ),
  landlordTitle: pick("NEXT_PUBLIC_BRAND_LANDLORD_TITLE", "Landlord"),
  propertyAddress: pick(
    "NEXT_PUBLIC_BRAND_PROPERTY_ADDRESS",
    "The Property"
  ),
  propertyDescription: pick(
    "NEXT_PUBLIC_BRAND_PROPERTY_DESCRIPTION",
    "The premises described in the Lease"
  ),
} as const

// ── Server-side identifiers (never exposed to the browser) ──────────────────

export const brandServer = {
  // Sender label used on outbound SMS messages.
  smsSender: pick("BRAND_SMS_SENDER", "EstateManager"),

  // "From" address for transactional emails.
  emailFrom: pick(
    "BRAND_EMAIL_FROM",
    `EstateManager <no-reply@estatemanager.app>`
  ),

  // Prefix for generated payment references (Paystack).
  referencePrefix: pick("BRAND_REFERENCE_PREFIX", "EM"),

  // Prefix for tenant invitation codes.
  invitePrefix: pick("BRAND_INVITE_PREFIX", "EM"),
} as const

export function formatMoney(amount: number): string {
  return `${brand.currencySymbol}${amount.toLocaleString(brand.locale)}`
}

export function formatMoneyWithLocale(amount: number): string {
  return new Intl.NumberFormat(brand.locale, {
    style: "currency",
    currency: brand.currencyCode,
  }).format(amount)
}

export function generateReference(prefix = brandServer.referencePrefix): string {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `${prefix}-${Date.now()}-${random}`
}

export function generateInviteCode(prefix = brandServer.invitePrefix): string {
  const bytes = Math.random().toString(36).substring(2, 10).toUpperCase()
  return `${prefix}-INV-${Date.now().toString(36)}-${bytes}`
}
