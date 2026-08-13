import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

// ─────────────────────────────────────────────────────────────────────────────
// Double-submit cookie CSRF protection.
//
// The proxy middleware sets a non-HttpOnly `csrf-token` cookie on every page
// response. Client code echoes the cookie value back in the `X-CSRF-Token`
// header for state-changing requests. The server rejects the request unless
// the header matches the cookie.
//
// Why this is safe:
//   - The cookie is SameSite=Lax, so a cross-site form POST will not carry it.
//   - Even if a malicious page could force a request, it cannot *read* the
//     cookie value (SOP), so it cannot set the matching header.
// ─────────────────────────────────────────────────────────────────────────────

export const CSRF_COOKIE_NAME = 'csrf-token'
export const CSRF_HEADER_NAME = 'x-csrf-token'

function generateCsrfToken(): string {
  return randomBytes(32).toString('base64url')
}

/**
 * Ensure the request carries a CSRF cookie, setting one on the response if not.
 * Called from the proxy middleware for every non-static response.
 */
export function ensureCsrfToken(request: NextRequest, response: NextResponse): void {
  if (request.cookies.get(CSRF_COOKIE_NAME)?.value) return

  response.cookies.set(CSRF_COOKIE_NAME, generateCsrfToken(), {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })
}

/**
 * Timing-safe comparison for CSRF tokens.
 */
function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  if (aBuf.length !== bBuf.length) return false
  let result = 0
  for (let i = 0; i < aBuf.length; i++) {
    result |= aBuf[i] ^ bBuf[i]
  }
  return result === 0
}

/**
 * Validate a CSRF token for state-changing requests.
 * Reads the cookie and the `X-CSRF-Token` header and requires an exact match.
 */
export async function csrfProtection(req: NextRequest): Promise<{ valid: boolean; error?: string }> {
  // Only enforce for state-changing methods.
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return { valid: true }
  }

  const cookieToken = req.cookies.get(CSRF_COOKIE_NAME)?.value
  const headerToken = req.headers.get(CSRF_HEADER_NAME)

  if (!cookieToken || !headerToken) {
    return { valid: false, error: 'CSRF token missing' }
  }

  if (!safeEqual(cookieToken, headerToken)) {
    return { valid: false, error: 'CSRF token invalid' }
  }

  return { valid: true }
}
