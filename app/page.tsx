import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function RootPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user role and redirect to correct dashboard
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  const role = profile?.role ?? 'tenant';

  switch (role) {
    case 'landlord':  redirect('/dashboard/landlord');
    case 'caretaker': redirect('/dashboard/caretaker');
    default:          redirect('/dashboard/tenant');
  }
}
