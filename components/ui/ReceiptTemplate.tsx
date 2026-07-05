import { formatCurrency, numberToWords } from '@/utils/formatters';

export interface ReceiptTemplateProps {
  payment: {
    id: string;
    tenant_name: string;
    amount: number;
    type: 'rent' | 'levy';
    date: string;
    period?: string;
    unit: string;
  };
  settings: {
    property_name: string;
    landlady_name: string;
    address: string;
    phone: string;
    email: string;
    account_name: string;
  };
}

export const ReceiptTemplate: React.FC<ReceiptTemplateProps> = ({
  payment,
  settings
}) => {
  const amountInWords = numberToWords(payment.amount);

  const formatWithSuffix = (date: string) => {
    const d = new Date(date);
    const day = d.getDate();
    const m = d.toLocaleString('default', { month: 'long' });
    const y = d.getFullYear();
    const suffix = ["th", "st", "nd", "rd"][(day % 10 > 3) ? 0 : Number(day % 100 - day % 10 !== 10) * (day % 10)];
    return `${m} ${d}${suffix}, ${y}`;
  };

  return (
    <div className="bg-white text-slate-900 p-10 rounded-sm max-w-2xl mx-auto font-serif shadow-2xl relative overflow-hidden border border-slate-200">
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none">
        <i className="ti ti-building text-[200px] text-slate-900" />
      </div>

      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8 relative z-10">
        <div className="flex items-center gap-4">
           <div className="text-2xl font-bold text-slate-900 uppercase tracking-widest leading-none">
             {settings.property_name}
           </div>
        </div>
        <div className="text-right">
           <p className="text-sm text-slate-600 font-sans max-w-[200px]">{settings.address}</p>
           <p className="text-xs text-slate-500 mt-1 font-sans font-bold">{settings.phone}</p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-8 font-sans bg-slate-50 p-4 rounded border border-slate-100">
        <div>
          <span className="bg-slate-900 text-white px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-sm">
            Official Receipt
          </span>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500">Date: <span className="text-slate-900 font-bold">{formatWithSuffix(payment.date)}</span></p>
          <p className="text-sm text-slate-500">Receipt No: <span className="text-slate-900 font-bold">#{payment.id.slice(0, 12)}</span></p>
        </div>
      </div>

      <div className="space-y-8 mb-10 relative z-10 text-sm md:text-base">
        <div className="flex items-baseline border-b border-dotted border-slate-400 pb-1">
          <span className="w-32 text-slate-500 font-bold uppercase text-xs tracking-wider">Received From:</span>
          <span className="font-bold text-slate-900 flex-1 uppercase text-lg pl-2">{payment.tenant_name}</span>
        </div>

        <div className="flex items-baseline border-b border-dotted border-slate-400 pb-1">
          <span className="w-32 text-slate-500 font-bold uppercase text-xs tracking-wider">The Sum of:</span>
          <span className="font-medium text-slate-900 flex-1 capitalize italic pl-2">{amountInWords}</span>
        </div>

        <div className="flex items-baseline border-b border-dotted border-slate-400 pb-1">
          <span className="w-32 text-slate-500 font-bold uppercase text-xs tracking-wider">Payment For:</span>
          <span className="font-bold text-slate-900 flex-1 pl-2">{payment.type === 'rent' ? 'Annual Rent' : 'Levy Payment'} {payment.period ? `(${payment.period})` : ''}</span>
        </div>

        <div className="flex items-baseline border-b border-dotted border-slate-400 pb-1">
           <span className="w-32 text-slate-500 font-bold uppercase text-xs tracking-wider">Property Unit:</span>
           <span className="font-bold text-slate-900 flex-1 pl-2">{payment.unit}</span>
        </div>
      </div>

      <div className="flex justify-between items-end mt-12 pt-6 border-t border-slate-100">
        <div className="border-2 border-slate-900 px-6 py-3 rounded-lg bg-white shadow-lg transform -rotate-1">
          <span className="text-[10px] text-slate-500 block font-sans uppercase font-bold tracking-widest">Total Paid</span>
          <span className="text-2xl font-bold text-slate-900 font-sans">{formatCurrency(payment.amount)}</span>
        </div>

        <div className="text-center relative">
           <div className="h-12 flex items-end justify-center mb-1 relative z-10">
             <span className="font-serif text-3xl text-slate-900 italic">{settings.landlady_name}</span>
           </div>
           <div className="h-0.5 w-48 bg-slate-900"></div>
           <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-wider">Manager's Signature</p>
        </div>
      </div>

      <div className="mt-12 text-center">
        <p className="text-[10px] text-slate-400 font-sans uppercase tracking-widest mb-1">Thank you for your payment</p>
      </div>
    </div>
  );
};