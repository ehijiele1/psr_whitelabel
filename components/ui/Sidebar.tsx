'use client';

import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { initials } from '@/utils';
import type { Role } from '@/types';

interface SidebarProps {
  role: string;
  name: string;
  pendingPayments?: number;
  openTickets?: number;
  unreadInbox?: number;
}

const NAV_SECTIONS: Record<string, { href: string; icon: string; label: string; badge?: string }[]> = {
  landlord: [
    { href: '/dashboard/landlord',               icon: 'ti-layout-dashboard', label: 'Dashboard' },
    { href: '/dashboard/landlord/properties',     icon: 'ti-building',        label: 'Properties' },
    { href: '/dashboard/landlord/tenants',         icon: 'ti-users',           label: 'Tenants' },
  ],
  landlord_ops: [
    { href: '/dashboard/landlord/payments',        icon: 'ti-cash',            label: 'Payments',     badge: 'payments' },
    { href: '/dashboard/landlord/receipts',         icon: 'ti-receipt',         label: 'Receipts' },
    { href: '/dashboard/landlord/tickets',          icon: 'ti-tool',            label: 'Maintenance',  badge: 'tickets' },
    { href: '/dashboard/landlord/inbox',            icon: 'ti-inbox',           label: 'Inbox',        badge: 'inbox' },
    { href: '/dashboard/landlord/reports',          icon: 'ti-chart-bar',       label: 'Reports' },
  ],
  landlord_admin: [
    { href: '/dashboard/landlord/settings',         icon: 'ti-settings',        label: 'Settings' },
  ],
  caretaker: [
    { href: '/dashboard/caretaker',                icon: 'ti-layout-dashboard', label: 'Dashboard' },
    { href: '/dashboard/landlord/tenants',          icon: 'ti-users',           label: 'Tenants' },
    { href: '/dashboard/landlord/units',            icon: 'ti-building',        label: 'Units' },
    { href: '/dashboard/landlord/tickets',          icon: 'ti-tool',            label: 'Maintenance',  badge: 'tickets' },
  ],
  tenant: [
    { href: '/dashboard/tenant',                   icon: 'ti-layout-dashboard', label: 'My Dashboard' },
    { href: '/dashboard/tenant/payments',           icon: 'ti-cash',            label: 'My Payments' },
    { href: '/dashboard/tenant/subscriptions',      icon: 'ti-refresh',         label: 'Subscriptions' },
    { href: '/dashboard/tenant/tickets',            icon: 'ti-tool',            label: 'Maintenance' },
  ],
};

const ROLE_AVATAR: Record<string, { bg: string; color: string }> = {
  landlord:  { bg: '#2F6FEB', color: '#D6E4FF' },
  caretaker: { bg: '#7C3AED', color: '#EDE9FE' },
  tenant:    { bg: '#16A34A', color: '#DCFCE7' },
};

const ROLE_LABEL: Record<string, string> = {
  landlord:  'Landlord / Owner',
  caretaker: 'Caretaker',
  tenant:    'Tenant',
};

export default function Sidebar({
  role, name,
  pendingPayments = 0,
  openTickets = 0,
  unreadInbox = 0,
}: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const supabase = createClient();

  const badges: Record<string, number> = {
    payments: pendingPayments,
    tickets: openTickets,
    inbox: unreadInbox,
  };

  const av = ROLE_AVATAR[role] ?? ROLE_AVATAR.tenant;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <aside className="w-[240px] flex-shrink-0 flex flex-col h-full"
      style={{ background: 'var(--fg)', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <i className="ti ti-building text-white text-sm" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white/90">PrinceSteve</div>
            <div className="text-caption" style={{ color: 'rgba(255,255,255,0.45)' }}>Property Management</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
        {role === 'landlord' && (
          <>
            <SectionLabel label="Main" />
            {NAV_SECTIONS.landlord.map(item => (
              <NavItem key={item.href} item={item} isActive={isActive(item.href)} count={item.badge ? badges[item.badge] : 0} />
            ))}
            <SectionLabel label="Operations" />
            {NAV_SECTIONS.landlord_ops.map(item => (
              <NavItem key={item.href} item={item} isActive={isActive(item.href)} count={item.badge ? badges[item.badge] : 0} />
            ))}
            <SectionLabel label="Admin" />
            {NAV_SECTIONS.landlord_admin.map(item => (
              <NavItem key={item.href} item={item} isActive={isActive(item.href)} count={0} />
            ))}
          </>
        )}

        {role === 'caretaker' && (
          <>
            <SectionLabel label="Main" />
            {NAV_SECTIONS.caretaker.map(item => (
              <NavItem key={item.href} item={item} isActive={isActive(item.href)} count={item.badge ? badges[item.badge] : 0} />
            ))}
          </>
        )}

        {role === 'tenant' && (
          <>
            <SectionLabel label="Main" />
            {NAV_SECTIONS.tenant.map(item => (
              <NavItem key={item.href} item={item} isActive={isActive(item.href)} count={0} />
            ))}
          </>
        )}
      </nav>

      {/* User */}
      <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3 px-2 py-2 mb-1">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
            style={{ background: av.bg, color: av.color }}
          >
            {initials(name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-small font-medium truncate text-white/85">{name}</div>
            <div className="text-caption" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {ROLE_LABEL[role] || role}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-small transition-all"
          style={{
            color: 'rgba(255,255,255,0.45)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}
        >
          <i className="ti ti-logout" /> Sign out
        </button>
      </div>
    </aside>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="caps-tight text-caption font-medium px-2 pt-4 pb-1.5"
      style={{ color: 'rgba(255,255,255,0.3)' }}>
      {label}
    </div>
  );
}

function NavItem({
  item, isActive, count,
}: {
  item: { href: string; icon: string; label: string };
  isActive: boolean;
  count: number;
}) {
  return (
    <a
      href={item.href}
      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-small transition-all"
      style={{
        background: isActive ? 'rgba(47,111,235,0.15)' : 'transparent',
        color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.55)',
      }}
      onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}}
      onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}}
    >
      <i className={`ti ${item.icon} text-base`} />
      <span className="flex-1">{item.label}</span>
      {count > 0 && (
        <span className="text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1"
          style={{ background: 'var(--danger)', color: 'white' }}>
          {count}
        </span>
      )}
    </a>
  );
}