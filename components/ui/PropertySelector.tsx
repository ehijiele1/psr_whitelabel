'use client';

import { useState } from 'react';

interface PropertyItem {
  id: string;
  name: string;
  status: string;
  landlord_id: string;
  address: string;
  created_at: string;
}

interface PropertySelectorProps {
  properties: PropertyItem[];
  currentPropertyId?: string;
  onSwitch: (property: PropertyItem) => void;
}

export default function PropertySelector({ properties, currentPropertyId, onSwitch }: PropertySelectorProps) {
  const [open, setOpen] = useState(false);

  if (properties.length <= 1) return null;

  const current = properties.find(p => p.id === currentPropertyId) || properties[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-[12px] font-medium text-slate-700 hover:border-blue-400 hover:bg-blue-50 transition-all"
      >
        <i className="ti ti-building text-blue-500" />
        <span className="max-w-28 truncate">{current?.name || 'Select property'}</span>
        <i className={`ti ti-chevron-down text-slate-400 text-[10px] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-20 py-1 max-h-64 overflow-y-auto">
            {properties.map(p => (
              <button
                key={p.id}
                onClick={() => { onSwitch(p); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-[12px] hover:bg-slate-50 flex items-center gap-3 transition-colors
                  ${p.id === current?.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700'}`}
              >
                <div className={`w-2 h-2 rounded-full ${p.status === 'active' ? 'bg-green-400' : p.status === 'inactive' ? 'bg-slate-300' : 'bg-amber-400'}`} />
                <span className="truncate">{p.name}</span>
                {p.id === current?.id && <i className="ti ti-check text-blue-500 ml-auto" />}
              </button>
            ))}
            <div className="border-t border-slate-100 mt-1 pt-1">
              <a
                href="/dashboard/landlord/properties"
                className="flex items-center gap-2 px-4 py-2.5 text-[12px] text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <i className="ti ti-settings" /> Manage properties
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}