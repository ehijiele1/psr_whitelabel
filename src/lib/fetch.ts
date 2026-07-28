/**
 * Enhanced fetch utility with timeout and retry support
 */

// Default configuration
const DEFAULT_TIMEOUT = 10000 // 10 seconds
const DEFAULT_MAX_RETRIES = 3
const DEFAULT_RETRY_DELAY = 1000 // 1 second

/**
 * Options for the enhanced fetch function
 */
export interface FetchOptions extends Omit<RequestInit, 'signal'> {
  /** Request timeout in milliseconds (default: 10000) */
  timeout?: number
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number
  /** Delay between retries in milliseconds (default: 1000) */
  retryDelay?: number
  /** Whether to retry on 429 (Rate Limit) responses (default: true) */
  retryOnRateLimit?: boolean
  /** Custom retry condition (default: retry on network errors and 5xx) */
  shouldRetry?: (response: Response | null, error: Error | null, attempt: number) => boolean
  /** Callback for retry attempts */
  onRetry?: (attempt: number, error: Error | Response, delay: number) => void
}

/**
 * Sleep function for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Enhanced fetch with timeout and retry support
 * 
 * @param url - URL to fetch
 * @param options - Fetch options including timeout and retry configuration
 * @returns Response from the fetch call
 * @throws Error if all retries fail or timeout is reached
 */
export async function fetchWithRetry(
  url: string | URL | Request,
  options: FetchOptions = {}
): Promise<Response> {
  const {
    timeout = DEFAULT_TIMEOUT,
    maxRetries = DEFAULT_MAX_RETRIES,
    retryDelay = DEFAULT_RETRY_DELAY,
    shouldRetry = defaultShouldRetry,
    onRetry,
    ...fetchOptions
  } = options

  let lastError: Error | null = null
  let lastResponse: Response | null = null

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      try {
        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal,
        })

        // Clear timeout
        clearTimeout(timeoutId)

        // Check if we should retry based on response
        if (attempt < maxRetries + 1 && shouldRetry(response, null, attempt)) {
          const delay = getRetryDelay(response, retryDelay, attempt)
          onRetry?.(attempt, response, delay)
          await sleep(delay)
          lastResponse = response
          continue
        }

        return response
      } catch (error) {
        // Clear timeout
        clearTimeout(timeoutId)

        const fetchError = error as Error
        
        // Don't retry on abort (timeout)
        if (fetchError.name === 'AbortError') {
          throw new Error(`Request timed out after ${timeout}ms`)
        }

        // Check if we should retry
        if (attempt < maxRetries + 1 && shouldRetry(null, fetchError, attempt)) {
          const delay = getRetryDelay(null, retryDelay, attempt)
          onRetry?.(attempt, fetchError, delay)
          await sleep(delay)
          lastError = fetchError
          continue
        }

        throw fetchError
      }
    } catch (error) {
      lastError = error as Error
      throw error
    }
  }

  // If we get here, all retries failed
  if (lastError) {
    throw lastError
  }
  
  // This shouldn't happen, but just in case
  throw new Error('All retry attempts failed')
}

/**
 * Default retry condition: retry on network errors, 5xx status codes, and 429 rate limits
 */
function defaultShouldRetry(
  response: Response | null,
  error: Error | null,
  attempt: number
): boolean {
  // Retry on network errors
  if (error && isNetworkError(error)) {
    return true
  }

  // Retry on 5xx server errors
  if (response && response.status >= 500 && response.status < 600) {
    return true
  }

  // Retry on 429 rate limit
  if (response && response.status === 429) {
    return true
  }

  return false
}

/**
 * Check if an error is a network error
 */
function isNetworkError(error: Error): boolean {
  return (
    error.name === 'TypeError' && 
    (error.message.includes('Failed to fetch') || 
     error.message.includes('NetworkError') ||
     error.message.includes('net::ERR_INTERNET_DISCONNECTED'))
  )
}

/**
 * Get retry delay, respecting Retry-After header if present
 */
function getRetryDelay(
  response: Response | null,
  baseDelay: number,
  attempt: number
): number {
  // Check for Retry-After header (in seconds)
  if (response) {
    const retryAfter = response.headers.get('Retry-After')
    if (retryAfter) {
      const delay = parseInt(retryAfter, 10) * 1000
      if (!isNaN(delay) && delay > 0) {
        return delay
      }
    }
    // Retry on 429 rate limit
    if (response.status === 429) {
      return baseDelay * Math.pow(2, attempt - 1)
    }
  }

  // Exponential backoff with jitter
  const exponentialDelay = baseDelay * Math.pow(2, attempt - 1)
  const jitter = Math.random() * 100 // Add up to 100ms of jitter
  return Math.min(exponentialDelay + jitter, 30000) // Cap at 30 seconds
}

/**
 * Create a configured fetch client for a specific API
 */
export function createApiClient(
  baseUrl: string,
  defaultOptions: FetchOptions = {}
) {
  return {
    get: async (path: string, options: FetchOptions = {}) => {
      const url = new URL(path, baseUrl)
      return fetchWithRetry(url, { 
        ...defaultOptions, 
        ...options,
        method: 'GET',
      })
    },
    post: async (path: string, body: unknown, options: FetchOptions = {}) => {
      const url = new URL(path, baseUrl)
      return fetchWithRetry(url, { 
        ...defaultOptions, 
        ...options,
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: JSON.stringify(body),
      })
    },
    put: async (path: string, body: unknown, options: FetchOptions = {}) => {
      const url = new URL(path, baseUrl)
      return fetchWithRetry(url, { 
        ...defaultOptions, 
        ...options,
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: JSON.stringify(body),
      })
    },
    patch: async (path: string, body: unknown, options: FetchOptions = {}) => {
      const url = new URL(path, baseUrl)
      return fetchWithRetry(url, { 
        ...defaultOptions, 
        ...options,
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: JSON.stringify(body),
      })
    },
    delete: async (path: string, options: FetchOptions = {}) => {
      const url = new URL(path, baseUrl)
      return fetchWithRetry(url, { 
        ...defaultOptions, 
        ...options,
        method: 'DELETE',
      })
    },
  }
}

/**
 * Paystack API client with built-in timeouts and retries
 */
export function createPaystackClient(apiKey: string) {
  return createApiClient('https://api.paystack.co', {
    timeout: 15000, // 15 seconds for Paystack
    maxRetries: 3,
    retryDelay: 1000,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  })
}

/**
 * Resend API client with built-in timeouts and retries
 */
export function createResendClient(apiKey: string) {
  return createApiClient('https://api.resend.com', {
    timeout: 10000,
    maxRetries: 3,
    retryDelay: 1000,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  })
}

/**
 * eBulkSMS API client with built-in timeouts and retries
 */
export function createEbulkSmsClient(apiKey: string, username: string) {
  return {
    sendSms: async (options: { sender: string; message: string; recipients: string[] }) => {
      const url = new URL('https://api.ebulksms.com:8080/sendsms.json')
      const params = new URLSearchParams({
        username,
        apikey: apiKey,
        sender: options.sender,
        messagetext: options.message,
        flash: '0',
      })
      
      // Add recipients
      options.recipients.forEach((recipient, index) => {
        params.append(`gsm${index + 1}`, recipient)
      })

      return fetchWithRetry(url, {
        timeout: 10000,
        maxRetries: 3,
        retryDelay: 1000,
        method: 'POST',
        body: params,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
    },
  }
}
