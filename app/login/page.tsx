'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Role = 'landlord' | 'caretaker' | 'tenant';

const ROLE_CONFIG: Record<Role, { label: string; desc: string; icon: string; color: string }> = {
  landlord:  { label: 'Landlord / Owner', desc: 'Full property & financial control', icon: 'ti-crown', color: '#2F6FEB' },
  caretaker: { label: 'Caretaker',        desc: 'Daily operations & maintenance',   icon: 'ti-tool',  color: '#7C3AED' },
  tenant:    { label: 'Tenant',           desc: 'Rent payments & maintenance',      icon: 'ti-user',  color: '#16A34A' },
};

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [role, setRole]       = useState<Role>('tenant');
  const [email, setEmail]     = useState('');
  const [password, setPass]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [phase, setPhase]     = useState<'select' | 'login'>('select');

  const cfg = ROLE_CONFIG[role];

  const handleLogin = async () => {
    if (!email || !password) { setError('Enter your email and password.'); return; }
    setLoading(true); setError('');

    const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password });

    if (authErr) {
      setError(authErr.message === 'Invalid login credentials'
        ? 'Incorrect email or password.'
        : authErr.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', data.user.id)
        .single();

      if (profile?.role !== role) {
        await supabase.auth.signOut();
        setError(`This account is registered as ${profile?.role || 'unknown'}, not ${role}.`);
        setLoading(false);
        return;
      }

      router.push(`/dashboard/${role}`);
    }
  };

  if (phase === 'select') {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
        <div className="max-w-3xl mx-auto px-6 py-16 md:py-24">
          <div className="text-center mb-12">
            <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-5">
              <i className="ti ti-building text-white text-2xl" />
            </div>
            <h1 className="text-h1 font-semibold display-tight" style={{ color: 'var(--fg)' }}>
              PrinceSteve Residence
            </h1>
            <p style={{ color: 'var(--fg-secondary)' }} className="mt-2 text-sm">
              Lagos, Nigeria — Property Management Portal
            </p>
          </div>

          <h2 className="text-small caps-tight font-medium mb-5 text-center" style={{ color: 'var(--fg-muted)' }}>
            Choose your portal
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(Object.entries(ROLE_CONFIG) as [Role, typeof ROLE_CONFIG[Role]][]).map(([r, c]) => (
              <button
                key={r}
                onClick={() => { setRole(r); setPhase('login'); }}
                className="surface rounded-xl p-6 text-left hover:border-accent hover:shadow-sm transition-all active:scale-[0.98] group"
                style={{ minHeight: '160px' }}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-colors"
                  style={{ background: `${c.color}15` }}>
                  <i className={`ti ${c.icon} text-lg`} style={{ color: c.color }} />
                </div>
                <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--fg)' }}>{c.label}</h3>
                <p className="text-small" style={{ color: 'var(--fg-muted)' }}>{c.desc}</p>
                <div className="mt-3 text-small font-medium" style={{ color: 'var(--accent)' }}>
                  Sign in →
                </div>
              </button>
            ))}
          </div>

          <div className="text-center mt-10 pt-8" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="text-small" style={{ color: 'var(--fg-secondary)' }}>
              New tenant?{' '}
              <a href="/apply" className="font-medium" style={{ color: 'var(--accent)' }}>
                Apply for tenancy →
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="max-w-sm mx-auto px-6 py-16 md:py-24">
        <button
          onClick={() => { setPhase('select'); setError(''); }}
          className="flex items-center gap-1.5 text-small font-medium mb-8"
          style={{ color: 'var(--fg-secondary)' }}
        >
          <i className="ti ti-arrow-left" /> Back
        </button>

        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
            style={{ background: `${cfg.color}15` }}>
            <i className={`ti ${cfg.icon} text-xl`} style={{ color: cfg.color }} />
          </div>
          <h1 className="text-xl font-semibold display-tight" style={{ color: 'var(--fg)' }}>
            {cfg.label}
          </h1>
          <p className="text-small mt-1" style={{ color: 'var(--fg-muted)' }}>{cfg.desc}</p>
        </div>

        <div className="surface rounded-xl p-6">
          <div className="mb-4">
            <label className="block text-small font-medium mb-1.5" style={{ color: 'var(--fg)' }}>
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="your@email.com"
              className="w-full px-3 py-2.5 text-sm transition-all outline-none"
              style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--surface)',
                color: 'var(--fg)',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          <div className="mb-5">
            <label className="block text-small font-medium mb-1.5" style={{ color: 'var(--fg)' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPass(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="••••••••"
              className="w-full px-3 py-2.5 text-sm transition-all outline-none"
              style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--surface)',
                color: 'var(--fg)',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-small" style={{ background: 'var(--danger-light)', color: 'var(--danger)', border: '1px solid var(--danger-light)' }}>
              <i className="ti ti-alert-circle mr-1" /> {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full rounded-lg py-3 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 text-white"
            style={{ background: cfg.color }}
          >
            {loading
              ? <><i className="ti ti-loader-2 animate-spin" /> Signing in…</>
              : <><i className="ti ti-login" /> Sign in</>
            }
          </button>
        </div>

        <p className="text-center text-caption mt-8" style={{ color: 'var(--fg-muted)' }}>
          35 Godilove Street, Akowonjo Egbeda, Lagos
        </p>
      </div>
    </div>
  );
}