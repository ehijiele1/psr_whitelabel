import { createServerComponentClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createAdminServerClient() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseServiceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  }

  return createServerComponentClient({
    cookies: () => cookieStore,
  }, {
    auth: {
      storage: {
        getItem: (key: string) => cookieStore.get(key)?.value,
        setItem: (key: string, value: string) => {
          cookieStore.set({
            name: key,
            value,
            options: {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
            },
          });
        },
        removeItem: (key: string) => {
          cookieStore.delete({ name: key });
        },
      },
      // Use service role key for admin operations
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  }, {
    global: {
      headers: {
        'x-client-info': 'princesteve-residence-server',
        'x-role': 'service-role',
      },
    },
  });
}