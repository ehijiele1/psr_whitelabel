import { NextRequest } from 'next/server'
import { createHmac, randomBytes } from 'crypto'

// In production, this MUST be set to a strong secret (32+ random bytes)
const CSRF_SECRET = process.env.CSRF_SECRET

// Token name for the cookie
const CSRF_TOKEN_NAME = 'csrf-token'

// Token expiration: 1 hour (in seconds)
const CSRF_TOKEN_EXPIRY = 60 * 60

/**
 * Generate a cryptographically secure random string
 */
function generateRandomString(length: number): string {
  return randomBytes(length).toString('base64url').substring(0, length)
}

/**
 * Generate a CSRF token with HMAC signature
 * The token format is: base64url(payload) + '.' + base64url(hmac_signature)
 */
export function generateCSRFToken(): string {
  // Validate that CSRF_SECRET is set in production
  if (!CSRF_SECRET && process.env.NODE_ENV === 'production') {
    throw new Error('CSRF_SECRET environment variable is required in production')
  }

  const secret = CSRF_SECRET || 'dev-secret-' + generateRandomString(32)

  const payload = {
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + CSRF_TOKEN_EXPIRY,
    rnd: generateRandomString(16) // Cryptographically secure random value
  }

  // Encode payload as base64url
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url')

  // Create HMAC signature
  const hmac = createHmac('sha256', secret)
  hmac.update(payloadBase64)
  const signature = hmac.digest('base64url')

  // Return token as payload.signature
  return `${payloadBase64}.${signature}`
}

/**
 * Verify a CSRF token by checking its HMAC signature
 */
function verifyToken(token: string): boolean {
  // Validate that CSRF_SECRET is set in production
  if (!CSRF_SECRET && process.env.NODE_ENV === 'production') {
    throw new Error('CSRF_SECRET environment variable is required in production')
  }

  const secret = CSRF_SECRET || 'dev-secret-' + generateRandomString(32)

  try {
    // Split token into payload and signature
    const [payloadBase64, signature] = token.split('.')
    if (!payloadBase64 || !signature) {
      return false
    }

    // Verify HMAC signature
    const hmac = createHmac('sha256', secret)
    hmac.update(payloadBase64)
    const expectedSignature = hmac.digest('base64url')

    // Use timing-safe comparison to prevent timing attacks
    if (!timingSafeEqual(Buffer.from(signature, 'base64url'), Buffer.from(expectedSignature, 'base64url'))) {
      return false
    }

    // Parse and verify payload
    const payloadStr = Buffer.from(payloadBase64, 'base64url').toString('utf8')
    const payload = JSON.parse(payloadStr)

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return false
    }

    return true
  } catch (error) {
    return false
  }
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i]
  }
  return result === 0
}

/**
 * Middleware to validate CSRF token for state-changing operations
 * Expects the token in the X-CSRF-Token header or x-csrf-token header
 */
export async function csrfProtection(req: NextRequest): Promise<{ valid: boolean, error?: string }> {
  // Only check for state-changing methods
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return { valid: true }
  }

  // Get the token from header (case-insensitive)
  const token = req.headers.get('x-csrf-token') || req.headers.get('X-CSRF-Token')

  if (!token) {
    return { valid: false, error: 'CSRF token missing' }
  }

  // Verify the token
  const isValid = verifyToken(token)
  return { valid: isValid, error: isValid ? undefined : 'CSRF token invalid or expired' }
}

/**
 * Get CSRF token from cookies
 */
export function getCSRFTokenFromRequest(req: NextRequest): string | null {
  const cookieHeader = req.headers.get('cookie') || ''
  const cookies = cookieHeader.split(';').map(c => c.trim())

  for (const cookie of cookies) {
    if (cookie.startsWith(`${CSRF_TOKEN_NAME}=`)) {
      return cookie.substring(CSRF_TOKEN_NAME.length + 1)
    }
  }

  return null
}

/**
 * Set CSRF token in response headers (as cookie)
 */
export function setCSRFTokenInResponse(res: Response): Response {
  const token = generateCSRFToken()
  const headers = new Headers(res.headers)
  headers.set(
    'Set-Cookie',
    `${CSRF_TOKEN_NAME}=${token}; HttpOnly; Secure; Path=/; SameSite=Strict; Max-Age=${CSRF_TOKEN_EXPIRY}`
  )
  return new Response(null, { status: res.status, headers, statusText: res.statusText })
}

/**
 * Create a CSRF-protected response with a new token
 */
export function createCSRFResponse(data: any, status: number = 200): Response {
  const token = generateCSRFToken()
  const response = new Response(JSON.stringify(data), { status })
  const headers = new Headers(response.headers)
  headers.set(
    'Set-Cookie',
    `${CSRF_TOKEN_NAME}=${token}; HttpOnly; Secure; Path=/; SameSite=Strict; Max-Age=${CSRF_TOKEN_EXPIRY}`
  )
  return new Response(JSON.stringify(data), { status, headers })
}