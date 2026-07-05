import { createServerComponentClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createServerClient() {
  const cookieStore = await cookies();

  return createServerComponentClient({
    cookies: () => cookieStore,
  });
}