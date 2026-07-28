import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/clientFactory';
import { requireRole } from '@/lib/auth/require-role';
import { paymentsImportSchema, validateSchema } from '@/lib/schemas';
import { csrfProtection } from '@/lib/csrf';

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
  // Apply CSRF protection
  const csrfResult = await csrfProtection(req);
  if (!csrfResult.valid) {
    return new NextResponse(
      JSON.stringify({ error: 'Invalid CSRF token' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const auth = await requireRole(['landlord']);
    if (!auth.ok) return auth.response;

    // Use regular client with RLS - landlord should have proper permissions
    const supabase = await createClient();

    const body = await req.json();
    
    // Validate using Zod schema
    const validation = validateSchema(paymentsImportSchema, body);
    if (!validation.success || !validation.data) {
      return NextResponse.json({ error: validation.error || 'Invalid data' }, { status: 400 });
    }

    const records: ImportRow[] = validation.data.records;
    const errors: { row: number; error: string }[] = [];
    const inserted: { receipt_no: string | null; tenant_name: string; amount: number }[] = [];

    // Validate all records first and collect valid ones
    const validRecords: Array<ImportRow & { tenant_id: string; property_id: string }> = []
    
    for (const r of records) {
      const { data: existingTenant } = await supabase
        .from('tenants')
        .select('id, property_id')
        .eq('unit', r.unit.trim())
        .eq('property_id', auth.user.property_id) // Ensure tenant belongs to landlord's property
        .maybeSingle();

      // Only allow import for tenants in the landlord's property
      if (!existingTenant) {
        errors.push({ row: errors.length + 1, error: `Tenant with unit ${r.unit} not found in your property` });
        continue;
      }

      validRecords.push({
        ...r,
        tenant_id: existingTenant.id,
        property_id: existingTenant.property_id,
      })
    }

    // Use batch insert for atomicity - all records are inserted in a single operation
    if (validRecords.length > 0) {
      const paymentRecords = validRecords.map(r => ({
        tenant_id: r.tenant_id,
        property_id: r.property_id,
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
        created_by: auth.user.id,
      }))

      const { data: insertedData, error: batchError } = await supabase
        .from('payments')
        .insert(paymentRecords)
        .select('receipt_no, tenant_name, amount')

      if (batchError) {
        // If batch insert fails, all records fail (atomic behavior)
        errors.push({ row: 1, error: `Batch insert failed: ${batchError.message}` })
      } else if (insertedData) {
        inserted.push(...insertedData)
      }
    }

    return NextResponse.json({
      insertedCount: inserted.length,
      errorCount: errors.length,
      inserted,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error('[Payments Import] Error:', err);
    return NextResponse.json({ error: (err as Error).message || 'Import failed' }, { status: 500 });
  }
}
