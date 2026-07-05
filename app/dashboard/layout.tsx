import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Sidebar from '@/components/ui/Sidebar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('user_id', user.id)
    .single();

  const role = profile?.role ?? 'tenant';

  return (
    <div className="flex h-screen overflow-hidden"
      style={{ background: 'var(--bg)' }}>
      <Sidebar role={role} name={profile?.full_name ?? ''} />
      <main className="flex-1 flex flex-col overflow-hidden min-w-0 page-enter">
        {children}
      </main>
    </div>
  );
}