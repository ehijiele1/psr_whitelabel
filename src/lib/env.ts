export function getEnv(key: string): string {
  const value = process.env[key]
  if (value === undefined) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(`[Env] Missing required environment variable: ${key}. Application cannot start.`)
    }
    // In development, log a warning but return empty string for non-critical paths
    console.warn(`[Env] Missing environment variable: ${key}`)
    return ""
  }
  return value
}

/**
 * Get an environment variable, throwing an error if missing (even in development)
 * Use this for variables that are always required
 */
export function getRequiredEnv(key: string): string {
  const value = process.env[key]
  if (value === undefined) {
    throw new Error(`[Env] Missing required environment variable: ${key}. Application cannot start.`)
  }
  return value
}

export function isDev(): boolean {
  return process.env.NODE_ENV === "development"
}

export function isProd(): boolean {
  return process.env.NODE_ENV === "production"
}

export function getPublicEnv(key: string): string {
  const NEXT_PUBLIC_PREFIX = "NEXT_PUBLIC_"
  if (!key.startsWith(NEXT_PUBLIC_PREFIX)) {
    console.warn(`[Env] ${key} is not a public environment variable (must start with ${NEXT_PUBLIC_PREFIX})`)
  }
  return getEnv(key)
}

export const env = {
  // Required in all environments
  appUrl: getRequiredEnv("NEXT_PUBLIC_APP_URL"),
  supabaseUrl: getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  
  // Required in production, warn in development
  supabaseServiceRoleKey: getEnv("SUPABASE_SERVICE_ROLE_KEY"),
  paystackPublicKey: getEnv("NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY"),
  paystackSecretKey: getEnv("PAYSTACK_SECRET_KEY"),
  
  // Optional but recommended
  vapidPublicKey: getEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY"),
  vapidPrivateKey: getEnv("VAPID_PRIVATE_KEY"),
  ebulkSmsUsername: getEnv("EBULK_SMS_USERNAME"),
  ebulkSmsApiKey: getEnv("EBULK_SMS_API_KEY"),
  resendApiKey: getEnv("RESEND_API_KEY"),
  emailFrom: getEnv("EMAIL_FROM") || "PrinceSteve Residence <noreply@vanniejay.com.ng>",
  
  // Upstash Redis for rate limiting (optional but recommended for production)
  upstashRedisRestUrl: getEnv("UPSTASH_REDIS_REST_URL"),
  upstashRedisRestToken: getEnv("UPSTASH_REDIS_REST_TOKEN"),
  
  // CSRF secret (required in production)
  csrfSecret: getEnv("CSRF_SECRET"),
}

const requiredEnvVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY",
  "PAYSTACK_SECRET_KEY",
] as const

const optionalEnvVars = [
  "EBULK_SMS_API_KEY",
  "EBULK_SMS_USERNAME",
  "SMS_WEBHOOK_API_KEY",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const

export function validateEnv(): void {
  if (typeof window !== "undefined") return

  const missing: string[] = []
  for (const key of requiredEnvVars) {
    if (!process.env[key]) {
      missing.push(key)
    }
  }

  if (missing.length > 0) {
    const message = `Missing required environment variables:\n  ${missing.join("\n  ")}\n\n` +
      "Please check your .env.local file."
    
    if (process.env.NODE_ENV === "production") {
      throw new Error(message)
    }
    
    console.error(message)
  }

  for (const key of optionalEnvVars) {
    if (!process.env[key]) {
      console.warn(`[Env] Optional environment variable "${key}" is not set.`)
    }
  }
}

export function validateRequiredEnv(): string[] {
  const missing: string[] = []
  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY",
    "PAYSTACK_SECRET_KEY",
  ]

  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key)
    }
  }

  return missing
}
