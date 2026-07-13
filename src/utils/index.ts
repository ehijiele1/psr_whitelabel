// ── Currency ─────────────────────────────────────────────────────
export const fmt = (n: number | undefined | null): string => {
  if (n === undefined || n === null) return '₦0';
  return '₦' + Number(n).toLocaleString('en-NG');
};

// ── Dates ─────────────────────────────────────────────────────────
export const today = (): string => new Date().toISOString().split('T')[0];

export const daysUntil = (dateStr: string): number =>
  Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);

export const timeAgo = (dateStr: string): string => {
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

export const formatDate = (dateStr: string): string =>
  new Date(dateStr + 'T00:00:00Z').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  });

export const addYears = (dateStr: string, years: number): string => {
  const d = new Date(dateStr);
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().split('T')[0];
};

// ── Strings ───────────────────────────────────────────────────────
export const initials = (name: string): string =>
  name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '??';

export const slugify = (str: string): string =>
  str.toLowerCase().replace(/[^a-z0-9]+/g, '-');

// ── Partial payment pro-rating ────────────────────────────────────
export const calcProRatedDueDate = (
  annualRent: number,
  totalPaid: number,
  leaseStart: string,
  payFreq: string
): { outstanding: number; dueDate: string } | null => {
  const outstanding = annualRent - totalPaid;
  if (outstanding <= 0) return null;

  const freqDays: Record<string, number> = {
    annual: 365, 'bi-annual': 182, quarterly: 91, monthly: 30,
  };
  const days = freqDays[payFreq] || 365;
  const dueDate = new Date(leaseStart);
  dueDate.setDate(dueDate.getDate() + days);
  return { outstanding, dueDate: dueDate.toISOString().split('T')[0] };
};

// ── WhatsApp deep link ────────────────────────────────────────────
export const getWhatsAppUrl = (phone: string, text: string): string => {
  const raw = phone.replace(/[^\d]/g, '');
  const clean = raw.startsWith('0') ? '234' + raw.slice(1) : raw;
  return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
};

// ── Levy rules ────────────────────────────────────────────────────
export const getLevyItems = (unitType: string): string[] => {
  if (unitType === 'apartment') return ['LAWMA', 'LUC', 'Sanitation'];
  return ['LAWMA', 'LUC']; // shops & stalls
};

// ── CSV export ────────────────────────────────────────────────────
export const exportToCSV = (data: Record<string, unknown>[], filename: string): void => {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers.map(h => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',')
  );
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${today()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// ── PWA camera detection ──────────────────────────────────────────
export const isStandalonePWA = (): boolean =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true);

export const getCameraConstraints = (): MediaStreamConstraints => ({
  video: {
    facingMode: isStandalonePWA() ? 'user' : 'user',
    width: { ideal: 400 },
    height: { ideal: 400 },
  },
});

// ── Export formatters ────────────────────────────────────────────
export { formatCurrency, numberToWords } from './formatters';

// ── Export utility functions ─────────────────────────────────────
export { cn } from './lib/utils';
