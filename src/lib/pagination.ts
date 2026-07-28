/**
 * Pagination utilities for Supabase queries
 */

// Default pagination settings
const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number
  pageSize?: number
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

/**
 * Parse and validate pagination parameters from query string
 */
export function parsePaginationParams(params: { [key: string]: string | string[] | undefined }): PaginationParams {
  let page = DEFAULT_PAGE
  let pageSize = DEFAULT_PAGE_SIZE

  if (params.page) {
    const pageNum = Array.isArray(params.page) ? Number(params.page[0]) : Number(params.page)
    if (!isNaN(pageNum) && pageNum > 0) {
      page = pageNum
    }
  }

  if (params.pageSize) {
    const size = Array.isArray(params.pageSize) ? Number(params.pageSize[0]) : Number(params.pageSize)
    if (!isNaN(size) && size > 0 && size <= MAX_PAGE_SIZE) {
      pageSize = size
    }
  }

  return { page, pageSize }
}

/**
 * Calculate pagination metadata
 */
export function calculatePagination(
  total: number,
  page: number,
  pageSize: number
): PaginatedResponse<any>['pagination'] {
  const totalPages = Math.ceil(total / pageSize)
  
  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  }
}

/**
 * Create paginated query options for Supabase
 */
export function getPaginationOptions(page: number, pageSize: number) {
  const offset = (page - 1) * pageSize
  return {
    limit: pageSize,
    offset,
  }
}

/**
 * Execute a paginated query on Supabase
 * 
 * @param supabase - Supabase client
 * @param from - Table name
 * @param select - Select clause
 * @param params - Pagination parameters
 * @param additionalQuery - Additional query methods to chain (e.g., .eq(), .order())
 * @returns Paginated response
 */
export async function paginatedQuery<T>(
  supabase: any,
  from: string,
  select: string,
  params: PaginationParams,
  additionalQuery?: (query: any) => any
): Promise<PaginatedResponse<T>> {
  const { page = DEFAULT_PAGE, pageSize = DEFAULT_PAGE_SIZE } = params
  const { limit, offset } = getPaginationOptions(page, pageSize)

  // First, get the total count
  const countQuery = supabase.from(from).select('*', { count: 'exact', head: true })
  
  // Apply additional query methods to count query if provided
  if (additionalQuery) {
    additionalQuery(countQuery)
  }

  const { count, error: countError } = await countQuery
  
  if (countError) {
    throw countError
  }

  const total = count || 0

   // Then, get the paginated data
  let query = supabase
    .from(from)
    .select(select)
    .range(offset, offset + (pageSize || DEFAULT_PAGE_SIZE) - 1)

  // Apply additional query methods if provided
  if (additionalQuery) {
    query = additionalQuery(query)
  }

  const { data, error } = await query
  
  if (error) {
    throw error
  }

  return {
    data: data || [],
    pagination: calculatePagination(total, page, pageSize),
  }
}

/**
 * Create pagination headers for API responses
 */
export function createPaginationHeaders(pagination: PaginatedResponse<any>['pagination']): Headers {
  const headers = new Headers()
  headers.set('X-Pagination-Page', String(pagination.page))
  headers.set('X-Pagination-Page-Size', String(pagination.pageSize))
  headers.set('X-Pagination-Total', String(pagination.total))
  headers.set('X-Pagination-Total-Pages', String(pagination.totalPages))
  return headers
}
