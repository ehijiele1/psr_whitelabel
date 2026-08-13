import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from "@/lib/csrf"

// ─────────────────────────────────────────────────────────────────────────────
// Client-side CSRF helpers.
//
// The proxy middleware sets the `csrf-token` cookie on page loads. For every
// state-changing fetch, read that cookie and echo it in the `X-CSRF-Token`
// header so the server's double-submit check passes.
// ─────────────────────────────────────────────────────────────────────────────

export function getCsrfToken(): string {
  if (typeof document === "undefined") return ""
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${CSRF_COOKIE_NAME}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : ""
}

/**
 * fetch wrapper that attaches the CSRF header to state-changing methods.
 */
export async function csrfFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const method = (init?.method || "GET").toUpperCase()
  const headers = new Headers(init?.headers)

  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    headers.set(CSRF_HEADER_NAME, getCsrfToken())
  }

  return fetch(input, { ...init, headers })
}
