import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { fmt } from '@/utils';

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { id } = await params;

  const { data: property } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .single();

  if (!property) redirect('/dashboard/landlord/properties');

  const { data: units } = await supabase
    .from('units')
    .select('*, tenants(*)')
    .eq('property_id', id)
    .order('name');

  const { data: recentPayments } = await supabase
    .from('payments')
    .select('*')
    .eq('property_id', id)
    .order('created_at', { ascending: false })
    .limit(5);

  const occupied = units?.filter(u => u.occupied).length ?? 0;
  const totalUnits = units?.length ?? 0;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="bg-white border-b border-slate-200 px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/landlord/properties" className="text-slate-400 hover:text-slate-600">
            <i className="ti ti-arrow-left" />
          </Link>
          <h1 className="text-[15px] font-semibold">{property.name}</h1>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full
            ${property.status === 'active' ? 'bg-green-100 text-green-700' : property.status === 'inactive' ? 'bg-slate-100 text-slate-500' : 'bg-amber-100 text-amber-700'}`}>
            {property.status}
          </span>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/landlord/properties/${id}/edit`}
            className="text-[12px] text-blue-600 hover:underline flex items-center gap-1 px-3 py-1.5 border border-blue-200 rounded-lg">
            <i className="ti ti-edit" /> Edit
          </Link>
          <Link href={`/dashboard/landlord/properties/${id}/units`}
            className="text-[12px] text-blue-600 hover:underline flex items-center gap-1 px-3 py-1.5 border border-blue-200 rounded-lg">
            <i className="ti ti-layers" /> Units
          </Link>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <Stat title="Total units" value={totalUnits} icon="ti-building" />
          <Stat title="Occupied" value={occupied} icon="ti-users" />
          <Stat title="Vacant" value={totalUnits - occupied} icon="ti-door" />
          <Stat title="Occupancy" value={totalUnits ? `${Math.round(occupied / totalUnits * 100)}%` : '-'} icon="ti-chart-bar" />
        </div>

        {/* Details */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-[13px] font-semibold mb-4">Property details</h3>
          <div className="grid grid-cols-2 gap-4 text-[13px]">
            <Detail label="Address" value={property.address} />
            <Detail label="Emergency contact" value={property.emergency_contact || '-'} />
            <Detail label="Caretaker contact" value={property.caretaker_contact || '-'} />
            <Detail label="Bank" value={[property.bank_name, property.account_number].filter(Boolean).join(' · ') || '-'} />
          </div>
        </div>

        {/* Units */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-semibold">Units</h3>
            <Link href={`/dashboard/landlord/properties/${id}/units`}
              className="text-[12px] text-blue-600 hover:underline flex items-center gap-1">
              Manage <i className="ti ti-chevron-right text-[10px]" />
            </Link>
          </div>
          {!units?.length ? (
            <p className="text-[12px] text-slate-400 text-center py-4">No units configured yet</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {units.map(u => (
                <div key={u.id} className={`p-3 rounded-lg border text-center
                  ${u.occupied ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="text-[13px] font-semibold">{u.name}</div>
                  <div className="text-[11px] text-slate-500 capitalize">{u.type}</div>
                  <div className={`text-[11px] font-medium mt-1 ${u.occupied ? 'text-green-600' : 'text-slate-400'}`}>
                    {u.occupied ? u.tenants?.[0]?.name || 'Occupied' : 'Vacant'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent payments */}
        {recentPayments?.length ? (
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-[13px] font-semibold mb-4">Recent payments</h3>
            <div className="space-y-2">
              {recentPayments.map(p => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <div className="text-[13px] font-medium">{p.tenant_name}</div>
                    <div className="text-[11px] text-slate-500">{p.date} · {p.type}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[13px] font-semibold">{fmt(Number(p.amount))}</div>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full
                      ${p.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Stat({ title, value, icon }: { title: string; value: string | number; icon: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1">
        <i className={`ti ${icon} text-[13px]`} /> {title}
      </div>
      <div className="text-[22px] font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[11px] text-slate-500">{label}</span>
      <p className="font-medium mt-0.5 break-words">{value}</p>
    </div>
  );
}