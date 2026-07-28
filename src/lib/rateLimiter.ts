import { NextRequest } from 'next/server'
import { Redis } from '@upstash/redis'

// Initialize Upstash Redis client
// In development, fall back to in-memory store with a warning
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

let redis: Redis | null = null
let useInMemoryFallback = false

if (UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: UPSTASH_REDIS_REST_URL,
    token: UPSTASH_REDIS_REST_TOKEN,
  })
} else if (process.env.NODE_ENV === 'production') {
  console.warn('[RateLimiter] UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required in production')
  useInMemoryFallback = true
}

// In-memory fallback for development (not suitable for production)
const inMemoryStore = new Map<string, { count: number; resetAt: number }>()

/**
 * Rate limit configuration for different endpoints
 */
export const RATE_LIMIT_CONFIG = {
  // Default rate limit: 5 requests per minute
  default: { limit: 5, windowMs: 60_000 },
  
  // Stricter limits for sensitive endpoints
  forgotPassword: { limit: 3, windowMs: 60_000 }, // 3 requests per minute
  login: { limit: 5, windowMs: 60_000 },
  setup: { limit: 1, windowMs: 3600_000 }, // 1 request per hour
  paymentsImport: { limit: 10, windowMs: 60_000 }, // 10 requests per minute
  emailsSend: { limit: 20, windowMs: 60_000 }, // 20 requests per minute
  notifySms: { limit: 20, windowMs: 60_000 }, // 20 requests per minute
  pushSubscribe: { limit: 10, windowMs: 60_000 }, // 10 requests per minute
  subscriptionsManage: { limit: 10, windowMs: 60_000 }, // 10 requests per minute
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

/**
 * Check if the request is within rate limit using distributed Redis
 * @param identifier - Usually IP address or user ID
 * @param limit - Maximum requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns RateLimitResult with allowed status and metadata
 */
export async function rateLimit(
  identifier: string,
  limit: number = 5,
  windowMs: number = 60_000
): Promise<RateLimitResult> {
  const now = Date.now()
  const windowStart = now - windowMs
  const key = `ratelimit:${identifier}`

  if (redis) {
    // Use Redis for distributed rate limiting
    const currentCount = await redis.get(key) as number | null
    const currentCountValue = currentCount || 0

    if (currentCountValue >= limit) {
      const ttl = await redis.ttl(key)
      return {
        allowed: false,
        remaining: 0,
        resetAt: now + ttl,
      }
    }

    // Increment count and set expiry
    const newCount = currentCountValue + 1
    const expiresAt = Math.floor((now + windowMs) / 1000)

    if (newCount === 1) {
      // First request in window, set expiry
      await redis.set(key, newCount, { ex: Math.ceil(windowMs / 1000) })
    } else {
      // Increment existing count
      await redis.incr(key)
    }

    const ttl = await redis.ttl(key)
    return {
      allowed: true,
      remaining: limit - newCount,
      resetAt: now + ttl * 1000,
    }
  } else if (useInMemoryFallback || process.env.NODE_ENV !== 'production') {
    // In-memory fallback for development
    const entry = inMemoryStore.get(key) || { count: 0, resetAt: 0 }

    if (now > entry.resetAt) {
      // Window expired, reset count
      entry.count = 0
      entry.resetAt = now + windowMs
    }

    if (entry.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt,
      }
    }

    // Increment count
    entry.count += 1
    inMemoryStore.set(key, entry)

    return {
      allowed: true,
      remaining: limit - entry.count,
      resetAt: entry.resetAt,
    }
  } else {
    // In production without Redis, allow all requests (not recommended)
    console.error('[RateLimiter] No rate limiting active in production! Configure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.')
    return {
      allowed: true,
      remaining: limit,
      resetAt: now + windowMs,
    }
  }
}

/**
 * Rate limit middleware for Next.js API routes
 * @param req - Next.js request object
 * @param configKey - Key from RATE_LIMIT_CONFIG or custom config
 * @returns RateLimitResult or throws if rate limited
 */
export async function rateLimitMiddleware(
  req: NextRequest,
  configKey: keyof typeof RATE_LIMIT_CONFIG | { limit: number; windowMs: number } = 'default'
): Promise<RateLimitResult> {
  const config = typeof configKey === 'string' ? RATE_LIMIT_CONFIG[configKey] : configKey
  const identifier = getIP(req)
  return rateLimit(identifier, config.limit, config.windowMs)
}

/**
 * Create a rate-limited response
 * @param result - Rate limit result
 * @param response - Original response to return if allowed
 * @returns Response (original or 429 Too Many Requests)
 */
export function createRateLimitedResponse(
  result: RateLimitResult,
  response: Response
): Response {
  if (result.allowed) {
    // Add rate limit headers
    const headers = new Headers(response.headers)
    headers.set('X-RateLimit-Limit', String(result.remaining + (result.remaining === 0 ? 1 : 0)))
    headers.set('X-RateLimit-Remaining', String(result.remaining))
    headers.set('X-RateLimit-Reset', String(Math.floor(result.resetAt / 1000)))
    return new Response(response.body, {
      status: response.status,
      headers,
      statusText: response.statusText,
    })
  } else {
    // Return 429 Too Many Requests
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000)
    return new Response(
      JSON.stringify({ error: 'Too many requests', retryAfter }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': '0',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.floor(result.resetAt / 1000)),
        },
      }
    )
  }
}

/**
 * Get client IP from request
 * Works with Vercel, localhost, and common headers
 */
export function getIP(req: NextRequest): string {
  // Check various headers that might contain the client IP
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim()
  }

  const realIP = req.headers.get('x-real-ip')
  if (realIP) return realIP

  const cfConnectingIP = req.headers.get('cf-connecting-ip')
  if (cfConnectingIP) return cfConnectingIP

  const trueClientIP = req.headers.get('true-client-ip')
  if (trueClientIP) return trueClientIP

  // For localhost development - use headers instead of req.ip
  const localIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                 req.headers.get('x-real-ip') ||
                 'unknown'
  
  // If no headers, return unknown
  return localIP || 'unknown'
}