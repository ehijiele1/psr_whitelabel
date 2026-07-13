import { createBrowserClient as createSSRClient } from "@supabase/ssr"

export function createClient() {
  return createSSRClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      global: {
        headers: {
          "x-client-info": "princesteve-residence-web",
        },
      },
    }
  )
}
