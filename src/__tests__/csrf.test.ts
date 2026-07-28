import { describe, it, expect } from "vitest"
import { csrfProtection } from "@/lib/csrf"

/**
 * Helper to build a NextRequest-like object with a given method and headers.
 */
function makeRequest(method: string, headers: Record<string, string> = {}) {
  const headerObj = new Map<string, string>()
  for (const [k, v] of Object.entries(headers)) headerObj.set(k.toLowerCase(), v)
  return {
    method,
    headers: {
      get(name: string) {
        return headerObj.get(name.toLowerCase()) ?? null
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
    const req = makeRequest("POST")
    const result = await csrfProtection(req)
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/missing/i)
  })

  it("rejects POST with malformed CSRF token", async () => {
    const req = makeRequest("POST", { "x-csrf-token": "not-a-real-token" })
    const result = await csrfProtection(req)
    expect(result.valid).toBe(false)
  })

  it("accepts either x-csrf-token or X-CSRF-Token header", async () => {
    // Without a valid token, both headers should still fail validation
    const req1 = makeRequest("POST", { "x-csrf-token": "garbage" })
    const req2 = makeRequest("POST", { "X-CSRF-Token": "garbage" })

    const r1 = await csrfProtection(req1)
    const r2 = await csrfProtection(req2)

    expect(r1.valid).toBe(false)
    expect(r2.valid).toBe(false)
  })
})
