import { describe, it, expect } from "vitest"
import {
  parsePaginationParams,
  getPaginationOptions,
  calculatePagination,
  createPaginationHeaders,
} from "@/lib/pagination"

describe("pagination utilities", () => {
  describe("parsePaginationParams", () => {
    it("returns defaults when searchParams is empty", () => {
      const result = parsePaginationParams({})
      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(20)
    })

    it("coerces string numbers from search params", () => {
      const result = parsePaginationParams({ page: "3", pageSize: "50" })
      expect(result.page).toBe(3)
      expect(result.pageSize).toBe(50)
    })

    it("clamps page to a minimum of 1", () => {
      const result = parsePaginationParams({ page: "0" })
      expect(result.page).toBe(1)
    })

    it("rejects pageSize above max (falls back to default)", () => {
      const result = parsePaginationParams({ pageSize: "500" })
      expect(result.pageSize).toBe(20)
    })

    it("falls back to defaults for non-numeric values", () => {
      const result = parsePaginationParams({ page: "abc", pageSize: "xyz" })
      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(20)
    })
  })

  describe("getPaginationOptions", () => {
    it("computes limit/offset from page and pageSize", () => {
      expect(getPaginationOptions(1, 20)).toEqual({ limit: 20, offset: 0 })
      expect(getPaginationOptions(2, 20)).toEqual({ limit: 20, offset: 20 })
      expect(getPaginationOptions(3, 50)).toEqual({ limit: 50, offset: 100 })
    })
  })

  describe("calculatePagination", () => {
    it("computes correct metadata for partial page", () => {
      const meta = calculatePagination(45, 1, 20)
      expect(meta.totalPages).toBe(3)
      expect(meta.hasNextPage).toBe(true)
      expect(meta.hasPreviousPage).toBe(false)
    })

    it("computes correct metadata for last page with partial items", () => {
      const meta = calculatePagination(45, 3, 20)
      expect(meta.totalPages).toBe(3)
      expect(meta.hasNextPage).toBe(false)
      expect(meta.hasPreviousPage).toBe(true)
    })

    it("handles empty result set", () => {
      const meta = calculatePagination(0, 1, 20)
      expect(meta.totalPages).toBe(0)
      expect(meta.hasNextPage).toBe(false)
      expect(meta.hasPreviousPage).toBe(false)
    })
  })

  describe("createPaginationHeaders", () => {
    it("includes standard pagination headers", () => {
      const meta = calculatePagination(45, 2, 20)
      const headers = createPaginationHeaders(meta)
      expect(headers.get("X-Pagination-Page")).toBe("2")
      expect(headers.get("X-Pagination-Page-Size")).toBe("20")
      expect(headers.get("X-Pagination-Total")).toBe("45")
      expect(headers.get("X-Pagination-Total-Pages")).toBe("3")
    })
  })
})
