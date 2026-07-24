import { NextRequest } from 'next/server'

// In production, use a strong secret from environment variables
const CSRF_SECRET = process.env.CSRF_SECRET || 'fallback-secret-for-development-only-change-in-production'

// Token name for the cookie
const CSRF_TOKEN_NAME = 'csrf-token'

/**
 * Generate a CSRF token
 */
export function generateCSRFToken(): string {
  // In a real app, you might want to include user ID or session info in the payload
  const payload = {
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour expiration
    random: Math.random().toString(36).substring(2, 15)
  }

  // Simple base64 URL safe encoding
  return btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Verify a CSRF token
 */
function verifyToken(token: string): boolean {
  try {
    // Add padding if needed
    const paddedToken = token.replace(/-/g, '+').replace(/_/g, '/')
    const payloadStr = atob(paddedToken)
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
 * Middleware to validate CSRF token for state-changing operations
 * Expects the token in the X-CSRF-Token header
 */
export async function csrfProtection(req: NextRequest): Promise<{ valid: boolean }> {
  // Only check for state-changing methods
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return { valid: true }
  }

  // Get the token from header
  const token = req.headers.get('x-csrf-token')

  if (!token) {
    return { valid: false }
  }

  // Verify the token
  const isValid = verifyToken(token)
  return { valid: isValid }
}

/**
 * Get CSRF token from cookies (for setting in response)
 * This would typically be used in middleware or API routes that render pages
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
    `${CSRF_TOKEN_NAME}=${token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=3600`
  )
  return new Response(null, { status: res.status, headers, statusText: '' })
}