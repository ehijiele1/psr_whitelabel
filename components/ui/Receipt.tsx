import { fmt, formatDate } from '@/utils';
import type { Payment, PropertySettings } from '@/types';

interface ReceiptProps {
  payment: Payment;
  settings: PropertySettings;
  mode?: 'screen' | 'print';
}

export default function Receipt({ payment: p, settings: s, mode = 'screen' }: ReceiptProps) {
  const isLevy = p.type === 'levy';
  const lb     = p.levy_breakdown ?? {};

  return (
    <div className={`bg-white rounded-xl overflow-hidden ${mode === 'screen' ? 'border border-slate-200 max-w-md mx-auto' : 'max-w-lg mx-auto'}`}>
      {/* Header */}
      <div className="bg-[#0F172A] text-white px-6 py-5">
        <div className="text-[16px] font-semibold">{s.property_name}</div>
        <div className="text-[11px] text-slate-400 mt-1">{s.address}</div>
        <div className="text-[11px] text-slate-400">Tel: {s.emergency_phone}</div>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest">
            {isLevy ? 'LEVY RECEIPT' : 'RENT RECEIPT'}
          </span>
          <span className="text-[12px] font-semibold font-mono">{p.receipt_no}</span>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-5">
        <div className="space-y-2">
          <Row label="Tenant"       value={p.tenant_name} bold />
          <Row label="Unit"         value={p.unit} />
          <Row label="Date paid"    value={formatDate(p.date)} />
          <Row label="Method"       value={p.method.replace(/\b\w/g, c => c.toUpperCase())} />
          {p.paystack_ref && (
            <Row label="Reference"  value={p.paystack_ref} mono />
          )}
          {p.period && (
            <Row label="Period"     value={p.period} small />
          )}
          {p.is_partial && (
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-[12px] text-slate-500">Payment type</span>
              <span className="text-[11px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                Partial payment
              </span>
            </div>
          )}

          {/* Levy breakdown */}
          {isLevy && (lb.LAWMA || lb.LUC || lb.Sanitation) && (
            <div className="mt-3 pt-3 border-t border-dashed border-slate-200">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Levy breakdown</p>
              {lb.LAWMA     ? <Row label="LAWMA (waste)"    value={fmt(lb.LAWMA)} /> : null}
              {lb.LUC       ? <Row label="LUC (land use)"   value={fmt(lb.LUC)} /> : null}
              {lb.Sanitation? <Row label="Sanitation"       value={fmt(lb.Sanitation)} /> : null}
            </div>
          )}
        </div>

        {/* Total */}
        <div className="flex justify-between items-center pt-4 mt-3 border-t-2 border-slate-200">
          <span className="text-[14px] font-semibold">
            {isLevy ? 'Total levy paid' : 'Total rent paid'}
          </span>
          <span className="text-[20px] font-bold text-slate-900">{fmt(Number(p.amount))}</span>
        </div>

        {/* Stamp */}
        <div className="text-center mt-5">
          <span className={`inline-block px-5 py-1.5 font-bold text-[14px] rounded border-2 tracking-widest rotate-[-5deg]
            ${p.status === 'approved'
              ? 'border-green-600 text-green-600'
              : 'border-amber-500 text-amber-500'
            }`}>
            {p.status === 'approved' ? 'PAID' : 'PENDING'}
          </span>
        </div>

        {/* Footer */}
        <div className="text-center mt-5 pt-4 border-t border-slate-100">
          <p className="text-[10px] text-slate-400">
            Official receipt · {s.property_name}
          </p>
          <p className="text-[10px] text-slate-400">
            Caretaker: {s.caretaker_name} · {s.caretaker_phone}
          </p>
          {/* NOTE: Bank details intentionally omitted from receipts per business rules */}
        </div>
      </div>
    </div>
  );
}

function Row({
  label, value, bold, mono, small,
}: {
  label: string;
  value: string;
  bold?: boolean;
  mono?: boolean;
  small?: boolean;
}) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
      <span className="text-[12px] text-slate-500">{label}</span>
      <span className={`
        ${small ? 'text-[11px]' : 'text-[13px]'}
        ${bold ? 'font-semibold' : ''}
        ${mono ? 'font-mono text-[11px]' : ''}
        text-slate-800
      `}>
        {value}
      </span>
    </div>
  );
}
