'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function NewPropertyPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    address: '',
    description: '',
    emergency_contact: '',
    caretaker_contact: '',
    bank_name: 'First Bank Nigeria',
    account_number: '',
    account_name: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.address) {
      setError('Property name and address are required.');
      return;
    }
    setLoading(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Not authenticated'); setLoading(false); return; }

    const { error: err } = await supabase.from('properties').insert({
      landlord_id: user.id,
      name: form.name,
      address: form.address,
      description: form.description || null,
      emergency_contact: form.emergency_contact || null,
      caretaker_contact: form.caretaker_contact || null,
      bank_name: form.bank_name,
      account_number: form.account_number || null,
      account_name: form.account_name || null,
    });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard/landlord/properties');
    router.refresh();
  };

  const Field = ({ label, value, onChange, placeholder, type = 'text' }: any) => (
    <div>
      <label className="block text-[12px] font-medium text-slate-700 mb-1.5">{label}</label>
      {type === 'textarea' ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="w-full border-2 border-slate-200 rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-blue-500 min-h-[80px]" />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="w-full border-2 border-slate-200 rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-blue-500" />
      )}
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="bg-white border-b border-slate-200 px-6 h-14 flex items-center">
        <h1 className="text-[15px] font-semibold">Add property</h1>
      </div>
      <div className="max-w-xl mx-auto p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-[12px] text-red-700 flex items-center gap-2">
            <i className="ti ti-alert-circle" /> {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <Field label="Property name *" value={form.name} onChange={(v: string) => setForm(p => ({ ...p, name: v }))} placeholder="e.g. PrinceSteve Residence Phase 2" />
          <Field label="Address *" value={form.address} onChange={(v: string) => setForm(p => ({ ...p, address: v }))} placeholder="Full property address" />
          <Field label="Description" value={form.description} onChange={(v: string) => setForm(p => ({ ...p, description: v }))} type="textarea" placeholder="Optional description" />
          <Field label="Emergency contact" value={form.emergency_contact} onChange={(v: string) => setForm(p => ({ ...p, emergency_contact: v }))} placeholder="+234xxxxxxxxx" />
          <Field label="Caretaker contact" value={form.caretaker_contact} onChange={(v: string) => setForm(p => ({ ...p, caretaker_contact: v }))} placeholder="+234xxxxxxxxx" />
          <div className="border-t border-slate-100 pt-4">
            <h3 className="text-[12px] font-semibold text-slate-700 mb-3">Bank details</h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Bank name" value={form.bank_name} onChange={(v: string) => setForm(p => ({ ...p, bank_name: v }))} />
              <Field label="Account number" value={form.account_number} onChange={(v: string) => setForm(p => ({ ...p, account_number: v }))} placeholder="e.g. 3012345678" />
              <Field label="Account name" value={form.account_name} onChange={(v: string) => setForm(p => ({ ...p, account_name: v }))} placeholder="e.g. Prince Steve Residence" className="col-span-2" />
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white rounded-xl py-3.5 text-[14px] font-semibold hover:bg-blue-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <><i className="ti ti-loader-2 animate-spin" /> Saving…</> : <><i className="ti ti-plus" /> Create property</>}
          </button>
        </form>
      </div>
    </div>
  );
}