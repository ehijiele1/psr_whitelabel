import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { timeAgo } from '@/utils';

export default async function CaretakerDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Verify caretaker role
  const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single();
  if (profile?.role !== 'caretaker') redirect('/login');

  const [
    { data: tenants },
    { data: units },
    { data: tickets },
  ] = await Promise.all([
    supabase.from('tenants').select('id, name, unit, phone, status, lease_end').eq('status', 'active'),
    supabase.from('units').select('*'),
    supabase.from('tickets').select('*').order('created_at', { ascending: false }),
  ]);

  const occupied   = units?.filter(u => u.occupied).length ?? 0;
  const total      = units?.length ?? 1;
  const openTix    = tickets?.filter(t => t.status !== 'resolved') ?? [];

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="bg-white border-b border-slate-200 px-6 h-14 flex items-center justify-between">
        <div>
          <h1 className="text-[15px] font-semibold">Caretaker Dashboard</h1>
          <p className="text-[11px] text-slate-500">PrinceSteve Residence operations</p>
        </div>
        {/* RBAC Notice */}
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
          <i className="ti ti-shield text-red-500 text-[14px]" />
          <span className="text-[11px] text-red-700 font-medium">Financial data restricted</span>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Stats — NO financial data */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-[11px] text-slate-500 mb-1 flex items-center gap-1"><i className="ti ti-users text-[13px]" /> Active tenants</div>
            <div className="text-[24px] font-semibold">{tenants?.length ?? 0}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-[11px] text-slate-500 mb-1 flex items-center gap-1"><i className="ti ti-building text-[13px]" /> Occupancy</div>
            <div className="text-[24px] font-semibold">{Math.round(occupied / total * 100)}%</div>
            <div className="text-[11px] text-slate-400">{occupied}/{total} units</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-[11px] text-slate-500 mb-1 flex items-center gap-1"><i className="ti ti-tool text-[13px]" /> Open tickets</div>
            <div className={`text-[24px] font-semibold ${openTix.length > 0 ? 'text-amber-600' : ''}`}>{openTix.length}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Tenant roster */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-[13px] font-semibold mb-4 flex items-center gap-1.5">
              <i className="ti ti-users text-blue-500" /> Tenant roster
            </h3>
            <div className="space-y-2">
              {(tenants ?? []).map(t => (
                <div key={t.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px] font-semibold flex-shrink-0">
                    {t.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium truncate">{t.name}</div>
                    <div className="text-[11px] text-slate-500">{t.unit} · {t.phone}</div>
                  </div>
                  <a
                    href={`https://wa.me/${t.phone.replace(/^0/, '234')}?text=${encodeURIComponent(`Hello ${t.name.split(' ')[0]}, this is Steve from PrinceSteve Residence.`)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="bg-green-100 text-green-700 px-2.5 py-1 rounded-lg text-[11px] hover:bg-green-200 flex items-center gap-1"
                  >
                    <i className="ti ti-brand-whatsapp" /> WhatsApp
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Open tickets */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-[13px] font-semibold mb-4 flex items-center gap-1.5">
              <i className="ti ti-tool text-amber-500" /> Maintenance tickets
            </h3>
            {openTix.length === 0 ? (
              <p className="text-[12px] text-slate-400 text-center py-4">No open tickets</p>
            ) : openTix.slice(0, 5).map(t => (
              <div key={t.id} className={`p-3 rounded-lg mb-2 border-l-4
                ${t.status === 'pending' ? 'bg-amber-50 border-amber-400' : 'bg-blue-50 border-blue-400'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[13px] font-medium">{t.title}</div>
                    <div className="text-[11px] text-slate-500">{t.unit} · {t.category} · {timeAgo(t.created_at)}</div>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full
                    ${t.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                    {t.status}
                  </span>
                </div>
                <div className="flex gap-2 mt-2">
                  {t.status === 'pending' && (
                    <form action={`/api/tickets/${t.id}/update`} method="POST">
                      <input type="hidden" name="status" value="in-progress" />
                      <button className="text-[11px] bg-blue-100 text-blue-700 px-2.5 py-1 rounded-lg hover:bg-blue-200">
                        Mark in progress
                      </button>
                    </form>
                  )}
                  <form action={`/api/tickets/${t.id}/update`} method="POST">
                    <input type="hidden" name="status" value="resolved" />
                    <button className="text-[11px] bg-green-100 text-green-700 px-2.5 py-1 rounded-lg hover:bg-green-200">
                      Mark resolved
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
