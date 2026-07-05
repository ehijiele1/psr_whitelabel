'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function InvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid'>('loading');

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      return;
    }

    const verify = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push(`/login?redirect=/invite?token=${token}`);
        return;
      }

      const { data: invitation, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('token', token)
        .single();

      if (error || !invitation) {
        setStatus('invalid');
      } else {
        setStatus('valid');
      }
    };

    verify();
  }, [token, router, supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="surface rounded-xl p-8 max-w-md w-full mx-4 text-center">
        <i className={`ti text-5xl mb-4 block ${status === 'loading' ? 'ti-loader animate-spin text-accent' : status === 'valid' ? 'ti-check-circle text-green-500' : 'ti-alert-circle text-red-500'}`} />
        {status === 'loading' && (
          <>
            <h1 className="text-[16px] font-semibold mb-2" style={{ color: 'var(--fg)' }}>Verifying invitation...</h1>
            <p className="text-[13px]" style={{ color: 'var(--fg-muted)' }}>Please wait while we verify your invitation link.</p>
          </>
        )}
        {status === 'valid' && (
          <>
            <h1 className="text-[16px] font-semibold mb-2" style={{ color: 'var(--fg)' }}>Invitation Accepted</h1>
            <p className="text-[13px]" style={{ color: 'var(--fg-muted)' }}>Your invitation has been verified. This page is under construction.</p>
          </>
        )}
        {status === 'invalid' && (
          <>
            <h1 className="text-[16px] font-semibold mb-2" style={{ color: 'var(--fg)' }}>Invalid Invitation</h1>
            <p className="text-[13px] mb-4" style={{ color: 'var(--fg-muted)' }}>
              The invitation link is invalid or has expired. Please contact your landlord.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 rounded-lg text-[13px] font-medium text-white"
              style={{ background: 'var(--accent)' }}
            >
              Go to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
