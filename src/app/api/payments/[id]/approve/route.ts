import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(['landlord']);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const supabase = await createAdminClient();

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
