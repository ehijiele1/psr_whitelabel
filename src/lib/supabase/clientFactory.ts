import { createClient as supabaseCreateClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { CookieOptions } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Client type for Supabase connections
 */
export type ClientType = 'browser' | 'server' | 'admin'

/**
 * Options for creating a Supabase client
 */
export interface ClientOptions {
  type: ClientType
  /** Include cookies in the client (for server-side session management) */
  withCookies?: boolean
  /** Custom headers to include in the client */
  headers?: Record<string, string>
}

/**
 * Default headers for service role clients
 */
const SERVICE_ROLE_HEADERS = {
  'x-client-info': 'estate-manager-server',
  'x-role': 'service-role',
}

/**
 * Create a Supabase client based on the specified type and options
 * 
 * @param options - Client configuration options
 * @returns Supabase client instance
 * @throws Error if required environment variables are missing
 */
export async function createSupabaseClient(options: ClientOptions = { type: 'server' }): Promise<SupabaseClient> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured')
  }

  // Browser client (for client-side use)
  if (options.type === 'browser') {
    if (!supabaseAnonKey) {
      throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured')
    }
    return supabaseCreateClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }

  // Server client (for server-side use with session cookies)
  if (options.type === 'server') {
    if (!supabaseAnonKey) {
      throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured')
    }

    const cookieStore = await cookies()

    const client = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // ignore in server components
          }
        },
      },
    })
    return client
  }

  // Admin client (for service role operations - bypasses RLS)
  if (options.type === 'admin') {
    if (!supabaseServiceRoleKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured')
    }

    const headers = { ...SERVICE_ROLE_HEADERS, ...options.headers }

    // If cookies are requested, use createServerClient with cookie handling
    if (options.withCookies) {
      const cookieStore = await cookies()
      const client = createServerClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
        global: {
          headers,
        },
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            } catch {}
          },
        },
      })
      return client
    }

    // Otherwise, use createClient without cookies
    const client = supabaseCreateClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers,
      },
    })
    return client
  }

  throw new Error(`Unknown client type: ${(options as ClientOptions).type}`)
}

/**
 * Create a regular server client (with session cookies)
 * Use this for most server-side operations where RLS should apply
 */
export async function createClient(): Promise<SupabaseClient> {
  return createSupabaseClient({ type: 'server' })
}

/**
 * Create an admin client (service role - bypasses RLS)
 * WARNING: Only use this when absolutely necessary (e.g., system-level operations)
 * Prefer createClient() with proper ownership checks instead
 */
export async function createAdminClient(): Promise<SupabaseClient> {
  return createSupabaseClient({ type: 'admin' })
}

/**
 * Create a browser client (for client-side use)
 */
export async function createBrowserClient(): Promise<SupabaseClient> {
  return createSupabaseClient({ type: 'browser' })
}

/**
 * Create an admin client with cookie handling
 * WARNING: Only use this when absolutely necessary
 */
export async function createAdminServerClient(): Promise<SupabaseClient> {
  return createSupabaseClient({ type: 'admin', withCookies: true })
}
