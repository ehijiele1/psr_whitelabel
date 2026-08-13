import { describe, it, expect } from "vitest"
import { csrfProtection, CSRF_COOKIE_NAME } from "@/lib/csrf"

/**
 * Helper to build a NextRequest-like object with a given method, headers and cookie.
 */
function makeRequest(
  method: string,
  headers: Record<string, string> = {},
  cookieToken?: string
) {
  const headerObj = new Map<string, string>()
  for (const [k, v] of Object.entries(headers)) headerObj.set(k.toLowerCase(), v)
  return {
    method,
    headers: {
      get(name: string) {
        return headerObj.get(name.toLowerCase()) ?? null
      },
    },
    cookies: {
      get(name: string) {
        return cookieToken !== undefined && name === CSRF_COOKIE_NAME
          ? { value: cookieToken }
          : undefined
      },
    },
  } as unknown as Parameters<typeof csrfProtection>[0]
}

describe("csrfProtection", () => {
  it("passes for safe HTTP methods (GET)", async () => {
    const req = makeRequest("GET")
    const result = await csrfProtection(req)
    expect(result.valid).toBe(true)
  })

  it("passes for safe HTTP methods (HEAD)", async () => {
    const req = makeRequest("HEAD")
    const result = await csrfProtection(req)
    expect(result.valid).toBe(true)
  })

  it("passes for safe HTTP methods (OPTIONS)", async () => {
    const req = makeRequest("OPTIONS")
    const result = await csrfProtection(req)
    expect(result.valid).toBe(true)
  })

  it("rejects POST without CSRF token header", async () => {
    const req = makeRequest("POST", {}, "valid-cookie-token")
    const result = await csrfProtection(req)
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/missing/i)
  })

  it("rejects POST without CSRF cookie", async () => {
    const req = makeRequest("POST", { "x-csrf-token": "abc123" })
    const result = await csrfProtection(req)
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/missing/i)
  })

  it("rejects POST with mismatched cookie and header", async () => {
    const req = makeRequest("POST", { "x-csrf-token": "header-token" }, "cookie-token")
    const result = await csrfProtection(req)
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/invalid/i)
  })

  it("accepts POST when cookie matches header", async () => {
    const req = makeRequest("POST", { "X-CSRF-Token": "shared-token" }, "shared-token")
    const result = await csrfProtection(req)
    expect(result.valid).toBe(true)
  })
})
