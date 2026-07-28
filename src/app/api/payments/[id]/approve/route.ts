import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/clientFactory';
import { requireRole } from '@/lib/auth/require-role';
import { csrfProtection } from '@/lib/csrf';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const supabase = await createClient();

    // First, verify the payment belongs to the landlord's property
    const { data: paymentCheck, error: checkError } = await supabase
      .from('payments')
      .select('id, property_id')
      .eq('id', id)
      .single();

    if (checkError) {
      console.error('[Payment Approve] Check failed:', checkError);
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }

    if (!paymentCheck) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Verify landlord owns the property
    if (paymentCheck.property_id !== auth.user.property_id) {
      return NextResponse.json({ error: 'Unauthorized - Payment does not belong to your property' }, { status: 403 });
    }

    const { data: payment, error } = await supabase
      .from('payments')
      .update({
        status: 'approved',
        approved_by: auth.user.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id, receipt_no, type, date')
      .single();

    if (error) {
      console.error('[Payment Approve] Update failed:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (payment && !payment.receipt_no) {
      const year = new Date(payment.date || Date.now()).getFullYear();
      const { data: receiptNo } = await supabase.rpc('generate_receipt_number', {
        p_type: payment.type,
        p_year: year,
      });
      if (receiptNo) {
        await supabase.from('payments').update({ receipt_no: receiptNo }).eq('id', id);
      }
    }

    await supabase.from('activity').insert({
      icon: 'ti-check',
      color: '#DCFCE7',
      icon_color: '#16A34A',
      text: `Payment ${id} was approved`,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Payment Approve] Error:', err);
    return NextResponse.json(
      { error: (err as Error).message || 'Approval failed' },
      { status: 500 }
    );
  }
}
