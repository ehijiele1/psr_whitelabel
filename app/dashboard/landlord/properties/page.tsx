import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function PropertiesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: properties } = await supabase
    .from('properties')
    .select('*, units(count), tenants(count)')
    .order('created_at', { ascending: false });

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="bg-white border-b border-slate-200 px-6 h-14 flex items-center justify-between">
        <h1 className="text-[15px] font-semibold">Properties</h1>
        <Link
          href="/dashboard/landlord/properties/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-[12px] font-medium hover:bg-blue-700 flex items-center gap-1.5"
        >
          <i className="ti ti-plus" /> Add property
        </Link>
      </div>

      <div className="p-6">
        {(!properties || properties.length === 0) ? (
          <div className="text-center py-16">
            <i className="ti ti-building text-5xl text-slate-300 mb-4 block" />
            <h2 className="text-[16px] font-semibold mb-2">No properties yet</h2>
            <p className="text-[13px] text-slate-500 mb-6">Create your first property to start managing tenants.</p>
            <Link
              href="/dashboard/landlord/properties/new"
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-[13px] font-medium hover:bg-blue-700 inline-flex items-center gap-2"
            >
              <i className="ti ti-plus" /> Create property
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {properties.map(p => (
              <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14px] font-semibold">{p.name}</h3>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full
                        ${p.status === 'active' ? 'bg-green-100 text-green-700' : p.status === 'inactive' ? 'bg-slate-100 text-slate-500' : 'bg-amber-100 text-amber-700'}`}>
                        {p.status}
                      </span>
                    </div>
                    <p className="text-[12px] text-slate-500 mt-0.5">{p.address}</p>
                  </div>
                </div>
                <div className="flex gap-4 mb-4">
                  <div className="text-[12px] text-slate-600">
                    <span className="font-semibold text-slate-900">{p.units?.[0]?.count ?? 0}</span> units
                  </div>
                  <div className="text-[12px] text-slate-600">
                    <span className="font-semibold text-slate-900">{p.tenants?.[0]?.count ?? 0}</span> tenants
                  </div>
                </div>
                <div className="flex gap-2 pt-3 border-t border-slate-100">
                  <Link
                    href={`/dashboard/landlord/properties/${p.id}`}
                    className="text-[12px] text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <i className="ti ti-eye" /> View
                  </Link>
                  <Link
                    href={`/dashboard/landlord/properties/${p.id}/edit`}
                    className="text-[12px] text-slate-600 hover:underline flex items-center gap-1"
                  >
                    <i className="ti ti-edit" /> Edit
                  </Link>
                  <Link
                    href={`/dashboard/landlord/properties/${p.id}/units`}
                    className="text-[12px] text-slate-600 hover:underline flex items-center gap-1"
                  >
                    <i className="ti ti-layers" /> Units
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}