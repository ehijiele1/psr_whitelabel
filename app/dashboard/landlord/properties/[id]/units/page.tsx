'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Property } from '@/src/lib/types';

export default function UnitsPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [property, setProperty] = useState<Property | null>(null);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'apartment', monthly_rent: '', deposit_amount: '' });
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    const id = params.id as string;
    const [{ data: prop }, { data: unitsData }] = await Promise.all([
      supabase.from('properties').select('name').eq('id', id).single(),
      supabase.from('units').select('*, tenants(name)').eq('property_id', id).order('name'),
    ]);
    if (prop) setProperty(prop as any);
    if (unitsData) setUnits(unitsData);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [params.id]);

  const addUnit = async () => {
    if (!form.name) return;
    setSaving(true);
    const { error } = await supabase.from('units').insert({
      property_id: params.id as string,
      name: form.name,
      type: form.type,
      monthly_rent: form.monthly_rent ? Number(form.monthly_rent) : null,
      deposit_amount: form.deposit_amount ? Number(form.deposit_amount) : null,
    });
    setSaving(false);
    if (error) return;
    setForm({ name: '', type: 'apartment', monthly_rent: '', deposit_amount: '' });
    setShowForm(false);
    fetch();
  };

  const deleteUnit = async (unitId: string) => {
    if (!confirm('Delete this unit?')) return;
    const { error } = await supabase.from('units').delete().eq('id', unitId);
    if (!error) fetch();
  };

  if (loading) return <div className="flex-1 flex items-center justify-center"><i className="ti ti-loader-2 animate-spin text-2xl text-slate-400" /></div>;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="bg-white border-b border-slate-200 px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-slate-400 hover:text-slate-600">
            <i className="ti ti-arrow-left" />
          </button>
          <h1 className="text-[15px] font-semibold">{property?.name || 'Property'} — Units</h1>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-[12px] font-medium hover:bg-blue-700 flex items-center gap-1.5">
          <i className="ti ti-plus" /> Add unit
        </button>
      </div>

      <div className="p-6">
        {showForm && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-5">
            <h3 className="text-[13px] font-semibold mb-4">Add unit</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1.5">Unit name *</label>
                <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Room 1" className="w-full border-2 border-slate-200 rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-blue-500 bg-white" />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1.5">Type</label>
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                  className="w-full border-2 border-slate-200 rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-blue-500 bg-white">
                  {['apartment', 'shop', 'stall', 'room'].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1.5">Monthly rent (₦)</label>
                <input type="number" value={form.monthly_rent} onChange={e => setForm(p => ({ ...p, monthly_rent: e.target.value }))}
                  placeholder="e.g. 150000" className="w-full border-2 border-slate-200 rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-blue-500 bg-white" />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1.5">Deposit (₦)</label>
                <input type="number" value={form.deposit_amount} onChange={e => setForm(p => ({ ...p, deposit_amount: e.target.value }))}
                  placeholder="e.g. 300000" className="w-full border-2 border-slate-200 rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-blue-500 bg-white" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={addUnit} disabled={saving || !form.name}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-[12px] font-medium hover:bg-blue-700 disabled:opacity-60 flex items-center gap-1.5">
                {saving ? <i className="ti ti-loader-2 animate-spin" /> : <i className="ti ti-plus" />} Add
              </button>
              <button onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-[12px] font-medium text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
            </div>
          </div>
        )}

        {units.length === 0 ? (
          <div className="text-center py-16">
            <i className="ti ti-layers text-5xl text-slate-300 mb-4 block" />
            <h2 className="text-[16px] font-semibold mb-2">No units yet</h2>
            <p className="text-[13px] text-slate-500">Add units to start tracking occupancy.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {units.map(u => (
              <div key={u.id} className={`bg-white border rounded-xl p-4 transition-all hover:shadow-sm
                ${u.occupied ? 'border-green-200' : 'border-slate-200'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14px] font-semibold">{u.name}</h3>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize
                        ${u.type === 'apartment' ? 'bg-blue-100 text-blue-700' : u.type === 'shop' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'}`}>
                        {u.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-[12px]">
                      {u.monthly_rent && <span className="text-slate-600">₦{Number(u.monthly_rent).toLocaleString()}/mo</span>}
                      {u.deposit_amount && <span className="text-slate-400">Dep: ₦{Number(u.deposit_amount).toLocaleString()}</span>}
                    </div>
                  </div>
                  <div className={`w-3 h-3 rounded-full mt-1 ${u.occupied ? 'bg-green-400' : 'bg-slate-300'}`} title={u.occupied ? 'Occupied' : 'Vacant'} />
                </div>
                {u.occupied && u.tenants?.[0]?.name && (
                  <div className="mt-3 pt-3 border-t border-slate-100 text-[12px] text-slate-600">
                    <i className="ti ti-user mr-1" /> {u.tenants[0].name}
                  </div>
                )}
                <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
                  <button onClick={() => deleteUnit(u.id)} className="text-[11px] text-red-500 hover:text-red-700 flex items-center gap-1">
                    <i className="ti ti-trash" /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}