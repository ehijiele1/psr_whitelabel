'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function EditPropertyPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    address: '',
    description: '',
    status: 'active' as 'active' | 'inactive' | 'maintenance',
    emergency_contact: '',
    caretaker_contact: '',
    bank_name: '',
    account_number: '',
    account_name: '',
  });

  useEffect(() => {
    const id = params.id as string;
    supabase.from('properties').select('*').eq('id', id).single().then(({ data, error }) => {
      if (error || !data) {
        router.push('/dashboard/landlord/properties');
        return;
      }
      setForm({
        name: data.name,
        address: data.address,
        description: data.description || '',
        status: data.status,
        emergency_contact: data.emergency_contact || '',
        caretaker_contact: data.caretaker_contact || '',
        bank_name: data.bank_name || '',
        account_number: data.account_number || '',
        account_name: data.account_name || '',
      });
      setFetching(false);
    });
  }, [params.id, router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.address) {
      setError('Property name and address are required.');
      return;
    }
    setLoading(true);
    setError('');

    const { error: err } = await supabase.from('properties').update({
      name: form.name,
      address: form.address,
      description: form.description || null,
      status: form.status,
      emergency_contact: form.emergency_contact || null,
      caretaker_contact: form.caretaker_contact || null,
      bank_name: form.bank_name || null,
      account_number: form.account_number || null,
      account_name: form.account_name || null,
    }).eq('id', params.id as string);

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    router.push(`/dashboard/landlord/properties/${params.id}`);
    router.refresh();
  };

  const Field = ({ label, value, onChange, placeholder, type = 'text' }: any) => (
    <div>
      <label className="block text-[12px] font-medium text-slate-700 mb-1.5">{label}</label>
      {type === 'textarea' ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="w-full border-2 border-slate-200 rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-blue-500 min-h-[80px]" />
      ) : type === 'select' ? (
        <select value={value} onChange={e => onChange(e.target.value)}
          className="w-full border-2 border-slate-200 rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-blue-500 bg-white">
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="maintenance">Maintenance</option>
        </select>
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="w-full border-2 border-slate-200 rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-blue-500" />
      )}
    </div>
  );

  if (fetching) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <i className="ti ti-loader-2 animate-spin text-2xl text-slate-400" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="bg-white border-b border-slate-200 px-6 h-14 flex items-center">
        <h1 className="text-[15px] font-semibold">Edit property</h1>
      </div>
      <div className="max-w-xl mx-auto p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-[12px] text-red-700 flex items-center gap-2">
            <i className="ti ti-alert-circle" /> {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Property name *" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} />
            <Field label="Status" value={form.status} onChange={v => setForm(p => ({ ...p, status: v }))} type="select" />
          </div>
          <Field label="Address *" value={form.address} onChange={v => setForm(p => ({ ...p, address: v }))} />
          <Field label="Description" value={form.description} onChange={v => setForm(p => ({ ...p, description: v }))} type="textarea" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Emergency contact" value={form.emergency_contact} onChange={v => setForm(p => ({ ...p, emergency_contact: v }))} />
            <Field label="Caretaker contact" value={form.caretaker_contact} onChange={v => setForm(p => ({ ...p, caretaker_contact: v }))} />
          </div>
          <div className="border-t border-slate-100 pt-4">
            <h3 className="text-[12px] font-semibold text-slate-700 mb-3">Bank details</h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Bank name" value={form.bank_name} onChange={v => setForm(p => ({ ...p, bank_name: v }))} />
              <Field label="Account number" value={form.account_number} onChange={v => setForm(p => ({ ...p, account_number: v }))} />
              <Field label="Account name" value={form.account_name} onChange={v => setForm(p => ({ ...p, account_name: v }))} className="col-span-2" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={loading}
              className="flex-1 bg-blue-600 text-white rounded-xl py-3.5 text-[14px] font-semibold hover:bg-blue-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? <><i className="ti ti-loader-2 animate-spin" /> Saving…</> : <><i className="ti ti-check" /> Save changes</>}
            </button>
            <button type="button" onClick={() => router.back()}
              className="px-6 py-3.5 border border-slate-200 rounded-xl text-[14px] font-medium text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}