'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function TenantTicketsPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push('/login');
    };
    checkAuth();
  }, [router, supabase]);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="bg-white border-b border-slate-200 px-6 h-14 flex items-center">
        <div>
          <h1 className="text-[15px] font-semibold">Maintenance Tickets</h1>
          <p className="text-[11px] text-slate-500">Submit and track maintenance requests</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="text-center">
          <i className="ti ti-tool text-5xl text-slate-300 mb-4 block" />
          <h2 className="text-[16px] font-semibold text-slate-600 mb-2">Under Construction</h2>
          <p className="text-[13px] text-slate-400">Tickets page is being built.</p>
        </div>
      </div>
    </div>
  );
}
