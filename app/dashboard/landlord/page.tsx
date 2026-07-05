import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { fmt, daysUntil, timeAgo } from '@/utils';
import PropertySelectorWrapper from './PropertySelectorWrapper';

export default async function LandlordDashboard(props: { searchParams?: Promise<{ property_id?: string }> }) {
  const searchParams = await props.searchParams;
  const propertyId = searchParams?.property_id;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: properties } = await supabase
    .from('properties')
    .select('id, name')
    .order('name');

  const effectivePropertyId = propertyId || properties?.[0]?.id;

  let tenantsQuery = supabase.from('tenants').select('*').eq('status', 'active');
  let unitsQuery = supabase.from('units').select('*');
  let paymentsQuery = supabase.from('payments').select('*').order('created_at', { ascending: false });
  let ticketsQuery = supabase.from('tickets').select('*').neq('status', 'resolved').order('created_at', { ascending: false });

  if (effectivePropertyId) {
    tenantsQuery = tenantsQuery.eq('property_id', effectivePropertyId);
    unitsQuery = unitsQuery.eq('property_id', effectivePropertyId);
    paymentsQuery = paymentsQuery.eq('property_id', effectivePropertyId);
    ticketsQuery = ticketsQuery.eq('property_id', effectivePropertyId);
  }

  const [
    { data: tenants },
    { data: units },
    { data: payments },
    { data: tickets },
    { data: inbox },
    { data: activity },
  ] = await Promise.all([
    tenantsQuery,
    unitsQuery,
    paymentsQuery,
    ticketsQuery,
    supabase.from('inbox').select('*').eq('read', false),
    supabase.from('activity').select('*').order('time', { ascending: false }).limit(5),
  ]);

  const occupied    = units?.filter(u => u.occupied).length ?? 0;
  const total       = units?.length ?? 1;
  const collected   = payments?.filter(p => p.status === 'approved').reduce((s, p) => s + Number(p.amount), 0) ?? 0;
  const pendingPays = payments?.filter(p => p.status === 'pending') ?? [];
  const alerts      = (tenants ?? [])
    .map(t => ({ ...t, days: daysUntil(t.lease_end) }))
    .filter(t => t.days <= 60)
    .sort((a, b) => a.days - b.days);

  const currentProperty = properties?.find(p => p.id === effectivePropertyId);

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Topbar */}
      <div className="surface px-6 h-14 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>Dashboard</h1>
          <p className="text-caption" style={{ color: 'var(--fg-muted)' }}>
            {currentProperty ? currentProperty.name : 'All properties'}
          </p>
        </div>
        <PropertySelectorWrapper
          properties={properties || []}
          currentPropertyId={effectivePropertyId}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Quick actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Record payment', icon: 'ti-cash',         href: '/dashboard/landlord/payments?action=new' },
            { label: 'Add tenant',     icon: 'ti-user-plus',    href: '/dashboard/landlord/tenants?action=new' },
            { label: 'Inbox',          icon: 'ti-inbox',        href: '/dashboard/landlord/inbox', badge: inbox?.length },
            { label: 'Maintenance',    icon: 'ti-tool',         href: '/dashboard/landlord/tickets' },
          ].map(qa => (
            <a
              key={qa.label}
              href={qa.href}
              className="surface rounded-xl p-4 hover:border-accent transition-all flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-lg bg-accent-light flex items-center justify-center relative">
                <i className={`ti ${qa.icon} text-base`} style={{ color: 'var(--accent)' }} />
                {(qa.badge ?? 0) > 0 && (
                  <span className="absolute -top-1 -right-1 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center" style={{ background: 'var(--danger)' }}>
                    {qa.badge}
                  </span>
                )}
              </div>
              <span className="text-small font-medium" style={{ color: 'var(--fg)' }}>{qa.label}</span>
            </a>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Active tenants',   value: tenants?.length ?? 0,                            sub: `${total - occupied} unit${total - occupied !== 1 ? 's' : ''} vacant`,       icon: 'ti-users' },
            { label: 'Occupancy',        value: `${Math.round(occupied / total * 100)}%`,         sub: `${occupied}/${total} units occupied`,                                        icon: 'ti-building' },
            { label: 'Total collected',  value: fmt(collected),                                   sub: 'All approved payments',                                                      icon: 'ti-cash' },
            { label: 'Pending payments', value: pendingPays.length,                               sub: 'Awaiting approval',                                                          icon: 'ti-clock', warn: !!pendingPays.length },
          ].map(stat => (
            <div key={stat.label} className="surface rounded-xl p-4">
              <div className="flex items-center gap-1.5 text-caption mb-1.5" style={{ color: 'var(--fg-muted)' }}>
                <i className={`ti ${stat.icon} text-sm`} /> {stat.label}
              </div>
              <div className="text-xl font-semibold leading-none" style={{ color: stat.warn ? 'var(--warn)' : 'var(--fg)' }}>
                {stat.value}
              </div>
              <div className="text-caption mt-1" style={{ color: 'var(--fg-muted)' }}>{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* Two-column */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Upcoming due dates */}
          <div className="surface rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-small font-semibold flex items-center gap-1.5" style={{ color: 'var(--fg)' }}>
                <i className="ti ti-calendar-event" style={{ color: 'var(--danger)' }} /> Upcoming due dates
              </h3>
              <span className="text-caption font-medium px-2 py-0.5 rounded-full" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>
                {alerts.length}
              </span>
            </div>
            {alerts.length === 0 ? (
              <p className="text-small text-center py-4" style={{ color: 'var(--fg-muted)' }}>No leases expiring soon</p>
            ) : alerts.map(t => (
              <div key={t.id} className="flex items-center gap-3 py-2.5" style={{ borderBottom: '1px solid var(--border-light)' }}>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: t.days <= 0 ? 'var(--danger)' : t.days <= 30 ? 'var(--warn)' : 'var(--accent)' }} />
                <div className="flex-1 min-w-0">
                  <div className="text-small font-medium truncate" style={{ color: 'var(--fg)' }}>{t.name}</div>
                  <div className="text-caption" style={{ color: 'var(--fg-muted)' }}>{t.unit} · {t.lease_end}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-caption font-medium px-2 py-0.5 rounded-full
                    ${t.days <= 0 ? 'bg-red-50 text-red-700' : t.days <= 30 ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
                    {t.days <= 0 ? 'Expired' : `${t.days}d`}
                  </span>
                  <a href={`/dashboard/landlord/tenants/${t.id}/renew`} className="text-caption font-medium px-2 py-0.5 rounded-full" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
                    Renew
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Activity feed */}
          <div className="surface rounded-xl p-5">
            <h3 className="text-small font-semibold flex items-center gap-1.5 mb-4" style={{ color: 'var(--fg)' }}>
              <i className="ti ti-bolt" style={{ color: 'var(--warn)' }} /> Recent activity
            </h3>
            {(!activity || activity.length === 0) ? (
              <p className="text-small text-center py-4" style={{ color: 'var(--fg-muted)' }}>No recent activity</p>
            ) : activity.map(a => (
              <div key={a.id} className="flex items-start gap-3 py-2" style={{ borderBottom: '1px solid var(--border-light)' }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: a.color }}>
                  <i className={`ti ${a.icon} text-sm`} style={{ color: a.icon_color }} />
                </div>
                <div>
                  <div className="text-small leading-snug" style={{ color: 'var(--fg-secondary)' }}>{a.text}</div>
                  <div className="text-caption mt-0.5" style={{ color: 'var(--fg-muted)' }}>{timeAgo(a.time)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending payments */}
        {pendingPays.length > 0 && (
          <div className="surface rounded-xl p-5">
            <h3 className="text-small font-semibold flex items-center gap-1.5 mb-4" style={{ color: 'var(--fg)' }}>
              <i className="ti ti-clock" style={{ color: 'var(--warn)' }} /> Pending approvals
            </h3>
            <div className="space-y-2">
              {pendingPays.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--warn-light)', border: '1px solid var(--warn-light)' }}>
                  <div className="flex-1">
                    <div className="text-small font-medium" style={{ color: 'var(--fg)' }}>{p.tenant_name}</div>
                    <div className="text-caption" style={{ color: 'var(--fg-muted)' }}>{p.unit} · {p.type === 'rent' ? 'Rent' : 'Levy'} · {fmt(Number(p.amount))}</div>
                  </div>
                  <form action={`/api/payments/${p.id}/approve`} method="POST">
                    <button className="text-small font-medium px-3 py-1.5 rounded-lg" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
                      <i className="ti ti-check" />
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}