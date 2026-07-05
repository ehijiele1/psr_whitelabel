'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Payment } from '@/types';

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map(line => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === ',' && !inQuotes) { values.push(current.trim()); current = ''; continue; }
      current += ch;
    }
    values.push(current.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] || ''; });
    return row;
  });
}

const columnMappingHints: Record<string, string[]> = {
  tenant_name: ['tenant name', 'tenant_name', 'name', 'tenant', 'full name'],
  unit: ['unit', 'apartment', 'room', 'flat', 'unit no'],
  type: ['type', 'payment type', 'payment_type', 'category'],
  amount: ['amount', 'total', 'sum', 'paid', 'payment'],
  method: ['method', 'payment method', 'payment_method', 'mode'],
  date: ['date', 'payment date', 'payment_date', 'paid on', 'created'],
  period: ['period', 'month', 'for', 'billing period'],
  status: ['status', 'payment status'],
  notes: ['notes', 'remark', 'comment', 'description'],
};

function guessColumn(header: string): string {
  const lower = header.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
  for (const [field, hints] of Object.entries(columnMappingHints)) {
    if (hints.includes(lower)) return field;
  }
  return '';
}

function toDateStr(val: string): string {
  const n = Date.parse(val);
  if (!isNaN(n)) return new Date(n).toISOString().split('T')[0];
  const m = val.match(/(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  return val;
}

function toNumber(val: string): number {
  const cleaned = val.replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
}

export default function LandlordPaymentsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'list' | 'import'>('list');

  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      setUser(session.user);

      const { data: roleData } = await supabase.rpc('get_user_role');
      if (roleData !== 'landlord') { router.push('/dashboard/tenant'); return; }

      const { data } = await supabase.from('payments').select('*').order('created_at', { ascending: false });
      if (data) setPayments(data);
      setLoading(false);
    };
    init();
  }, [router, supabase]);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setImportResult(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);
      setCsvRows(rows);
      if (rows.length > 0) {
        const headers = Object.keys(rows[0]);
        setCsvHeaders(headers);
        const guess: Record<string, string> = {};
        headers.forEach(h => { const g = guessColumn(h); if (g) guess[h] = g; });
        setColumnMap(guess);
      }
    };
    reader.readAsText(file);
  }, []);

  const updateMapping = (header: string, field: string) => {
    setColumnMap(prev => ({ ...prev, [header]: field }));
  };

  const mappedRows = csvRows.map(row => {
    const out: Record<string, any> = {};
    for (const [header, field] of Object.entries(columnMap)) {
      if (!field || field === '__skip__') continue;
      const raw = row[header] || '';
      if (field === 'amount') out[field] = toNumber(raw);
      else if (field === 'date') out[field] = toDateStr(raw);
      else if (field === 'is_partial') out[field] = raw.toLowerCase() === 'true' || raw === '1' || raw === 'yes';
      else if (field === 'type') out[field] = raw.toLowerCase().includes('levy') ? 'levy' : 'rent';
      else if (field === 'method') {
        const v = raw.toLowerCase();
        if (v.includes('cash')) out[field] = 'cash';
        else if (v.includes('bank') || v.includes('transfer')) out[field] = 'bank transfer';
        else if (v.includes('paystack') || v.includes('card')) out[field] = 'paystack';
        else out[field] = 'cash';
      } else {
        out[field] = raw;
      }
    }
    return out;
  }).filter(r => r.tenant_name && r.unit && r.amount && r.date);

  const doImport = async () => {
    setImporting(true);
    setImportResult(null);
    try {
      const res = await fetch('/api/payments/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: mappedRows }),
      });
      const data = await res.json();
      setImportResult(data);
      if (data.insertedCount > 0) {
        const { data: refreshed } = await supabase.from('payments').select('*').order('created_at', { ascending: false });
        if (refreshed) setPayments(refreshed);
      }
    } catch {
      setImportResult({ error: 'Network error — try again' });
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <i className="ti ti-loader animate-spin text-2xl" style={{ color: 'var(--accent)' }} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="bg-white border-b border-slate-200 px-6 h-14 flex items-center justify-between">
        <div>
          <h1 className="text-[15px] font-semibold">Payments</h1>
          <p className="text-[11px] text-slate-500">Record and manage rent & levy payments</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTab('list')}
            className={`px-3 py-1.5 text-[12px] rounded-lg ${tab === 'list' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
          >History</button>
          <button
            onClick={() => setTab('import')}
            className={`px-3 py-1.5 text-[12px] rounded-lg ${tab === 'import' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
          >Import CSV</button>
        </div>
      </div>

      {tab === 'list' && (
        <div className="p-6">
          {payments.length === 0 ? (
            <div className="text-center py-16">
              <i className="ti ti-cash text-5xl text-slate-300 mb-4 block" />
              <h2 className="text-[16px] font-semibold text-slate-600 mb-2">No Payments Yet</h2>
              <p className="text-[13px] text-slate-400">Switch to the Import tab to upload payment history.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] text-slate-500 uppercase">
                    <th className="pb-2 pr-4">Receipt</th>
                    <th className="pb-2 pr-4">Tenant</th>
                    <th className="pb-2 pr-4">Unit</th>
                    <th className="pb-2 pr-4">Type</th>
                    <th className="pb-2 pr-4 text-right">Amount</th>
                    <th className="pb-2 pr-4">Method</th>
                    <th className="pb-2 pr-4">Date</th>
                    <th className="pb-2 pr-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.id} className="border-b border-slate-100">
                      <td className="py-2.5 pr-4 font-mono text-[11px] text-slate-400">{p.receipt_no || '—'}</td>
                      <td className="py-2.5 pr-4 font-medium">{p.tenant_name}</td>
                      <td className="py-2.5 pr-4 text-slate-500">{p.unit}</td>
                      <td className="py-2.5 pr-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${p.type === 'rent' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                          {p.type}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-right font-mono">₦{Number(p.amount).toLocaleString()}</td>
                      <td className="py-2.5 pr-4 text-slate-500 capitalize">{p.method}</td>
                      <td className="py-2.5 pr-4 text-slate-500">{p.date}</td>
                      <td className="py-2.5 pr-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                          p.status === 'approved' ? 'bg-green-50 text-green-600' :
                          p.status === 'rejected' ? 'bg-red-50 text-red-600' :
                          'bg-yellow-50 text-yellow-600'
                        }`}>
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
      )}

      {tab === 'import' && (
        <div className="p-6 max-w-4xl">
          {csvRows.length === 0 ? (
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center">
              <i className="ti ti-upload text-4xl text-slate-300 mb-3 block" />
              <h3 className="text-[15px] font-semibold text-slate-600 mb-1">Upload Payment CSV</h3>
              <p className="text-[12px] text-slate-400 mb-4">
                CSV must have headers. Columns: tenant_name, unit, type, amount, method, date, period, status, notes
              </p>
              <label className="inline-block px-4 py-2 rounded-lg text-[13px] font-medium text-white cursor-pointer" style={{ background: 'var(--accent)' }}>
                Choose File
                <input type="file" accept=".csv,.txt" onChange={handleFile} className="hidden" />
              </label>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-semibold">
                  {csvRows.length} rows found — Map CSV columns to payment fields
                </h3>
                <button
                  onClick={() => { setCsvRows([]); setColumnMap({}); setImportResult(null); }}
                  className="text-[12px] text-slate-400 hover:text-red-500"
                >Clear</button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
                {csvHeaders.map(header => (
                  <div key={header} className="bg-slate-50 rounded-lg p-3">
                    <label className="block text-[11px] text-slate-400 mb-1 truncate" title={header}>
                      {header}
                    </label>
                    <select
                      value={columnMap[header] || ''}
                      onChange={e => updateMapping(header, e.target.value)}
                      className="w-full text-[12px] border border-slate-200 rounded px-2 py-1.5 bg-white"
                    >
                      <option value="">— Skip —</option>
                      <option value="tenant_name">Tenant Name</option>
                      <option value="unit">Unit</option>
                      <option value="type">Type (rent/levy)</option>
                      <option value="amount">Amount</option>
                      <option value="method">Method</option>
                      <option value="date">Date</option>
                      <option value="period">Period</option>
                      <option value="status">Status</option>
                      <option value="notes">Notes</option>
                      <option value="is_partial">Is Partial</option>
                    </select>
                  </div>
                ))}
              </div>

              {mappedRows.length > 0 && (
                <>
                  <div className="overflow-x-auto rounded-lg border border-slate-200 mb-4">
                    <table className="w-full text-left text-[12px]">
                      <thead>
                        <tr className="bg-slate-50 text-[11px] text-slate-500 uppercase">
                          <th className="p-2">#</th>
                          <th className="p-2">Tenant</th>
                          <th className="p-2">Unit</th>
                          <th className="p-2">Type</th>
                          <th className="p-2 text-right">Amount</th>
                          <th className="p-2">Method</th>
                          <th className="p-2">Date</th>
                          <th className="p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mappedRows.slice(0, 50).map((r, i) => (
                          <tr key={i} className="border-t border-slate-100">
                            <td className="p-2 text-slate-400">{i + 1}</td>
                            <td className="p-2 font-medium">{r.tenant_name}</td>
                            <td className="p-2 text-slate-500">{r.unit}</td>
                            <td className="p-2">
                              <span className={`px-1.5 py-0.5 rounded text-[11px] ${r.type === 'rent' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>{r.type}</span>
                            </td>
                            <td className="p-2 text-right font-mono">₦{Number(r.amount).toLocaleString()}</td>
                            <td className="p-2 text-slate-500">{r.method}</td>
                            <td className="p-2 text-slate-500">{r.date}</td>
                            <td className="p-2">{r.status || 'approved'}</td>
                          </tr>
                        ))}
                        {mappedRows.length > 50 && (
                          <tr className="border-t border-slate-100">
                            <td colSpan={8} className="p-2 text-center text-slate-400 text-[11px]">
                              ... and {mappedRows.length - 50} more rows
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <button
                    onClick={doImport}
                    disabled={importing}
                    className="px-6 py-2.5 rounded-lg text-[13px] font-medium text-white disabled:opacity-50"
                    style={{ background: 'var(--accent)' }}
                  >
                    {importing ? (
                      <><i className="ti ti-loader animate-spin mr-2" /> Importing...</>
                    ) : (
                      <>Import {mappedRows.length} Payment{mappedRows.length !== 1 ? 's' : ''}</>
                    )}
                  </button>
                </>
              )}

              {importResult && (
                <div className={`mt-4 p-4 rounded-lg text-[13px] ${importResult.error ? 'bg-red-50 text-red-600' : importResult.insertedCount > 0 ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                  {importResult.error ? (
                    <p><i className="ti ti-alert-circle mr-1" /> {importResult.error}</p>
                  ) : (
                    <>
                      <p className="font-medium mb-1">
                        <i className="ti ti-check-circle mr-1" />
                        Imported {importResult.insertedCount} payment{importResult.insertedCount !== 1 ? 's' : ''}
                        {importResult.errorCount > 0 && ` (${importResult.errorCount} error${importResult.errorCount !== 1 ? 's' : ''})`}
                      </p>
                      {importResult.errors && (
                        <ul className="text-[11px] mt-1 space-y-0.5 text-red-500">
                          {importResult.errors.map((e: any, i: number) => (
                            <li key={i}>Row {e.row}: {e.error}</li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
