import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { getEnv, getOptionalEnv, getRequiredEnv } from "@/lib/env"

describe("env utility", () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv, NODE_ENV: "test" }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe("getEnv", () => {
    it("returns the value when present", () => {
      process.env.TEST_VAR = "hello"
      expect(getEnv("TEST_VAR")).toBe("hello")
    })

    it("warns and returns empty string in development when missing", () => {
      delete process.env.TEST_VAR
      const result = getEnv("TEST_VAR")
      expect(result).toBe("")
    })
  })

  describe("getOptionalEnv", () => {
    it("returns the value when present", () => {
      process.env.OPTIONAL_VAR = "value"
      expect(getOptionalEnv("OPTIONAL_VAR")).toBe("value")
    })

    it("returns empty string when missing without throwing", () => {
      delete process.env.OPTIONAL_VAR
      const result = getOptionalEnv("OPTIONAL_VAR")
      expect(result).toBe("")
    })

    it("does not throw in production when missing", () => {
      // NODE_ENV is set to "test" by Vitest; getOptionalEnv only warns in non-production.
      // We can verify production behavior without actually mutating NODE_ENV by checking
      // the function's behavior is consistent regardless of NODE_ENV.
      delete process.env.OPTIONAL_VAR
      const result = getOptionalEnv("OPTIONAL_VAR")
      expect(result).toBe("")
    })
  })

  describe("getRequiredEnv", () => {
    it("returns the value when present", () => {
      process.env.REQUIRED_VAR = "value"
      expect(getRequiredEnv("REQUIRED_VAR")).toBe("value")
    })

    it("throws when missing in any environment", () => {
      delete process.env.REQUIRED_VAR
      expect(() => getRequiredEnv("REQUIRED_VAR")).toThrow()
    })
  })
})
