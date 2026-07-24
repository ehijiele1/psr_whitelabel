import { NextRequest } from 'next/server'

// In-memory store for rate limiting
// In production, use Redis or another distributed store
const requestMap = new Map<string, number[]>()

// Clean up old entries periodically (every minute)
setInterval(() => {
  const now = Date.now()
  for (const [key, timestamps] of requestMap.entries()) {
    // Remove timestamps older than 1 minute
    const valid = timestamps.filter(t => now - t < 60_000)
    if (valid.length === 0) {
      requestMap.delete(key)
    } else {
      requestMap.set(key, valid)
    }
  }
}, 60_000)

/**
 * Check if the request is within rate limit
 * @param identifier - Usually IP address or user ID
 * @param limit - Maximum requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns true if allowed, false if rate limited
*/
export function rateLimit(
  identifier: string,
  limit: number = 5,
  windowMs: number = 60_000
): boolean {
  const now = Date.now()
  const windowStart = now - windowMs

  // Get existing timestamps for this identifier
  const timestamps = requestMap.get(identifier) || []

  // Filter out timestamps outside the window
  const validTimestamps = timestamps.filter(t => t > windowStart)

  // Check if limit exceeded
  if (validTimestamps.length >= limit) {
    return false
  }

  // Add current timestamp and store
  validTimestamps.push(now)
  requestMap.set(identifier, validTimestamps)
  return true
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

  // If no headers, return unknown
  return 'unknown'
}