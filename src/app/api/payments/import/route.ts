import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';

interface ImportRow {
  tenant_name: string;
  unit: string;
  type: string;
  amount: number;
  method: string;
  date: string;
  period?: string;
  status?: string;
  is_partial?: boolean;
  notes?: string;
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(['landlord']);
    if (!auth.ok) return auth.response;

    const supabase = await createAdminClient();

    const body = await req.json();
    const records: ImportRow[] = body.records;

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: 'No records provided' }, { status: 400 });
    }

    const validTypes = ['rent', 'levy'];
    const validMethods = ['cash', 'bank transfer', 'paystack'];
    const validStatuses = ['pending', 'approved', 'rejected'];
    const errors: { row: number; error: string }[] = [];
    const inserted: { receipt_no: string | null; tenant_name: string; amount: number }[] = [];

    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      const row = i + 1;

      if (!r.tenant_name?.trim()) { errors.push({ row, error: 'tenant_name is required' }); continue; }
      if (!r.unit?.trim()) { errors.push({ row, error: 'unit is required' }); continue; }
      if (!validTypes.includes(r.type)) { errors.push({ row, error: `type must be one of: ${validTypes.join(', ')}` }); continue; }
      if (typeof r.amount !== 'number' || r.amount <= 0) { errors.push({ row, error: 'amount must be a positive number' }); continue; }
      if (!validMethods.includes(r.method)) { errors.push({ row, error: `method must be one of: ${validMethods.join(', ')}` }); continue; }
      if (!r.date) { errors.push({ row, error: 'date is required' }); continue; }

      const dateObj = new Date(r.date);
      if (isNaN(dateObj.getTime())) { errors.push({ row, error: 'date is not valid (use YYYY-MM-DD)' }); continue; }

      if (r.status && !validStatuses.includes(r.status)) {
        errors.push({ row, error: `status must be one of: ${validStatuses.join(', ')}` });
        continue;
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ errors, insertedCount: 0, errorCount: errors.length }, { status: 422 });
    }

    for (const r of records) {
      const { data: existingTenant } = await supabase
        .from('tenants')
        .select('id, property_id')
        .eq('unit', r.unit.trim())
        .maybeSingle();

      const { data, error } = await supabase
        .from('payments')
        .insert({
          tenant_id: existingTenant?.id || undefined,
          property_id: existingTenant?.property_id || undefined,
          tenant_name: r.tenant_name.trim(),
          unit: r.unit.trim(),
          type: r.type,
          amount: r.amount,
          method: r.method,
          date: r.date,
          period: r.period?.trim() || null,
          status: r.status || 'approved',
          is_partial: r.is_partial || false,
          notes: r.notes?.trim() || null,
        })
        .select('receipt_no, tenant_name, amount')
        .single();

      if (error) {
        errors.push({ row: errors.length + 1, error: error.message });
      } else if (data) {
        inserted.push(data);
      }
    }

    return NextResponse.json({
      insertedCount: inserted.length,
      errorCount: errors.length,
      inserted,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message || 'Import failed' }, { status: 500 });
  }
}
