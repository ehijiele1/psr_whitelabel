'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface SubscriptionPlan {
  id: string;
  name: string;
  amount: number;
  interval: string;
  plan_code: string;
  is_active: boolean;
  properties: { name: string };
}

interface TenantSubscription {
  id: string;
  plan_id: string;
  status: string;
  amount: number;
  interval: string;
  next_payment_date: string;
  last_payment_date: string;
  subscription_code: string;
  created_at: string;
}

export default function TenantSubscriptionsPage() {
  const supabase = createClient();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [mySubs, setMySubs] = useState<TenantSubscription[]>([]);
  const [tenantId, setTenantId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: tenant } = await supabase
        .from('tenants')
        .select('id, property_id')
        .eq('user_id', user.id)
        .single();

      if (!tenant) { setLoading(false); return; }
      setTenantId(tenant.id);

      const [plansRes, subsRes] = await Promise.all([
        supabase.from('subscription_plans').select('*, properties(name)').eq('is_active', true).eq('property_id', tenant.property_id),
        supabase.from('tenant_subscriptions').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: false }),
      ]);

      if (plansRes.data) setPlans(plansRes.data);
      if (subsRes.data) setMySubs(subsRes.data);
      setLoading(false);
    };
    fetch();
  }, []);

  const subscribe = async (planId: string) => {
    setActivating(planId);
    try {
      const res = await fetch('/api/subscriptions/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'subscribe', plan_id: planId, tenant_id: tenantId }),
      });
      const data = await res.json();
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      }
    } catch (err) {
      console.error('[Sub] Subscribe error:', err);
    } finally {
      setActivating(null);
    }
  };

  const cancel = async (subId: string) => {
    if (!confirm('Cancel this subscription?')) return;
    const res = await fetch('/api/subscriptions/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel', subscription_id: subId }),
    });
    if (res.ok) {
      setMySubs(prev => prev.map(s => s.id === subId ? { ...s, status: 'cancelled' } : s));
    }
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><i className="ti ti-loader-2 animate-spin text-2xl text-slate-400" /></div>;
  }

  const activeSub = mySubs.find(s => s.status === 'active');

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="bg-white border-b border-slate-200 px-6 h-14 flex items-center">
        <h1 className="text-[15px] font-semibold">Rent Subscriptions</h1>
      </div>

      <div className="p-6 space-y-6">
        {activeSub && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <i className="ti ti-refresh text-green-500 text-2xl" />
              <div className="flex-1">
                <h3 className="text-[14px] font-semibold text-green-800">Active subscription</h3>
                <p className="text-[12px] text-green-700">
                  ₦{Number(activeSub.amount).toLocaleString()} / {activeSub.interval}
                  {activeSub.next_payment_date ? ` · Next: ${activeSub.next_payment_date}` : ''}
                </p>
              </div>
              <button onClick={() => cancel(activeSub.id)}
                className="text-[12px] text-red-600 hover:text-red-800 border border-red-200 px-3 py-1.5 rounded-lg">
                Cancel
              </button>
            </div>
          </div>
        )}

        {!activeSub && plans.length > 0 && (
          <>
            <h2 className="text-[13px] font-semibold">Available plans</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plans.map(plan => (
                <div key={plan.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-400 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-[14px] font-semibold">{plan.name}</h3>
                      <p className="text-[11px] text-slate-500">{plan.properties?.name || ''}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-[20px] font-bold text-blue-600">₦{Number(plan.amount).toLocaleString()}</div>
                      <div className="text-[11px] text-slate-500 capitalize">per {plan.interval}</div>
                    </div>
                  </div>
                  <button onClick={() => subscribe(plan.id)} disabled={activating === plan.id}
                    className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-[12px] font-medium hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2">
                    {activating === plan.id ? <i className="ti ti-loader-2 animate-spin" /> : <i className="ti ti-refresh" />}
                    {activating === plan.id ? 'Redirecting...' : 'Subscribe'}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {!activeSub && plans.length === 0 && (
          <div className="text-center py-16">
            <i className="ti ti-refresh text-5xl text-slate-300 mb-4 block" />
            <h2 className="text-[16px] font-semibold mb-2">No subscription plans available</h2>
            <p className="text-[13px] text-slate-500">Your landlord has not set up any subscription plans yet.</p>
          </div>
        )}

        {mySubs.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-[13px] font-semibold mb-4">History</h3>
            <div className="space-y-2">
              {mySubs.map(s => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize
                      ${s.status === 'active' ? 'bg-green-100 text-green-700' : s.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}`}>
                      {s.status}
                    </span>
                    <span className="text-[12px] text-slate-600 ml-2">
                      ₦{Number(s.amount).toLocaleString()} / {s.interval}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {s.created_at?.split('T')[0]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}