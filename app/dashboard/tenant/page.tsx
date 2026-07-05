import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { fmt, daysUntil, calcProRatedDueDate, formatDate } from '@/utils';

export default async function TenantDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single();
  if (profile?.role !== 'tenant') redirect('/login');

  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!tenant) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center p-8">
          <i className="ti ti-clock text-5xl text-amber-400 mb-4 block" />
          <h2 className="text-[16px] font-semibold mb-2">Account under review</h2>
          <p className="text-[13px] text-slate-500">Your application is being reviewed by the landlord. You'll receive access once approved.</p>
        </div>
      </div>
    );
  }

  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('tenant_id', tenant.id)
    .order('date', { ascending: false });

  const { data: tickets } = await supabase
    .from('tickets')
    .select('*')
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false })
    .limit(3);

  const approvedRent = (payments ?? [])
    .filter(p => p.status === 'approved' && p.type === 'rent')
    .reduce((s, p) => s + Number(p.amount), 0);

  const balance = Number(tenant.rent) - approvedRent;
  const daysLeft = daysUntil(tenant.lease_end);
  const proRate = balance > 0 ? calcProRatedDueDate(Number(tenant.rent), approvedRent, tenant.lease_start, tenant.pay_freq) : null;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="bg-white border-b border-slate-200 px-6 h-14 flex items-center">
        <div>
          <h1 className="text-[15px] font-semibold">My Dashboard</h1>
          <p className="text-[11px] text-slate-500">{tenant.unit} · {tenant.type}</p>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Profile card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4">
          {tenant.photo
            ? <img src={tenant.photo} alt={tenant.name} className="w-14 h-14 rounded-full object-cover border-4 border-white shadow" />
            : <div className="w-14 h-14 rounded-full bg-blue-700 text-blue-100 flex items-center justify-center text-[18px] font-semibold flex-shrink-0">
                {tenant.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
          }
          <div className="flex-1">
            <div className="text-[16px] font-semibold">{tenant.name}</div>
            <div className="text-[12px] text-slate-500">{tenant.unit} · {tenant.phone}</div>
            <div className="text-[12px] text-slate-500">Lease: {formatDate(tenant.lease_start)} → {formatDate(tenant.lease_end)}</div>
          </div>
          <span className={`text-[12px] font-medium px-3 py-1.5 rounded-full
            ${daysLeft <= 0 ? 'bg-red-100 text-red-700' : daysLeft <= 30 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
            {daysLeft <= 0 ? 'Lease expired' : daysLeft <= 30 ? `${daysLeft}d left` : 'Active'}
          </span>
        </div>

        {/* Outstanding balance alert */}
        {proRate && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3">
            <i className="ti ti-alert-circle text-amber-500 text-[20px] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-[13px] font-semibold text-amber-800">Outstanding balance: {fmt(proRate.outstanding)}</div>
              <div className="text-[12px] text-amber-700 mt-0.5">
                Due on or before <strong>{formatDate(proRate.dueDate)}</strong>
              </div>
            </div>
            <a
              href="/dashboard/tenant/payments?action=pay"
              className="bg-amber-500 text-white px-4 py-2 rounded-lg text-[12px] font-semibold hover:bg-amber-600 flex-shrink-0"
            >
              Pay now
            </a>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-[11px] text-slate-500 mb-1">Annual rent</div>
            <div className="text-[16px] font-semibold">{fmt(Number(tenant.rent))}</div>
            <div className="text-[11px] text-slate-400 capitalize">{tenant.pay_freq}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-[11px] text-slate-500 mb-1">Total paid</div>
            <div className="text-[16px] font-semibold text-green-600">{fmt(approvedRent)}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-[11px] text-slate-500 mb-1">Balance</div>
            <div className={`text-[16px] font-semibold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {balance > 0 ? fmt(balance) : 'Settled ✓'}
            </div>
          </div>
        </div>

        {/* Payment history */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-semibold">Payment history</h3>
            <a href="/dashboard/tenant/payments" className="text-[12px] text-blue-600 hover:underline">View all →</a>
          </div>
          {!payments?.length ? (
            <p className="text-[12px] text-slate-400 text-center py-4">No payment records yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['Date', 'Type', 'Amount', 'Receipt', 'Status'].map(h => (
                      <th key={h} className="text-left py-2 px-3 text-[11px] font-semibold text-slate-400 bg-slate-50">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payments.slice(0, 5).map(p => (
                    <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-2.5 px-3">{p.date}</td>
                      <td className="py-2.5 px-3">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium
                          ${p.type === 'rent' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                          {p.type === 'rent' ? 'Rent' : 'Levy'}
                        </span>
                        {p.is_partial && <span className="ml-1 text-[11px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">partial</span>}
                      </td>
                      <td className="py-2.5 px-3 font-semibold">{fmt(Number(p.amount))}</td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-400 font-mono">{p.receipt_no}</td>
                      <td className="py-2.5 px-3">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium
                          ${p.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent tickets */}
        {tickets && tickets.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[13px] font-semibold">Maintenance requests</h3>
              <a href="/dashboard/tenant/tickets" className="text-[12px] text-blue-600 hover:underline">View all →</a>
            </div>
            {tickets.map(t => (
              <div key={t.id} className={`p-3 rounded-lg mb-2 border-l-4
                ${t.status === 'pending' ? 'bg-amber-50 border-amber-400' : t.status === 'in-progress' ? 'bg-blue-50 border-blue-400' : 'bg-green-50 border-green-400'}`}>
                <div className="flex justify-between items-center">
                  <div className="text-[13px] font-medium">{t.title}</div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full
                    ${t.status === 'pending' ? 'bg-amber-100 text-amber-700' : t.status === 'in-progress' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                    {t.status}
                  </span>
                </div>
                {t.notes && <div className="text-[11px] text-slate-500 mt-1">{t.notes}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
