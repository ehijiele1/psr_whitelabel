import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createAdminClient();

    const { error } = await supabase
      .from('payments')
      .update({ status: 'approved' })
      .eq('id', id);

    if (error) {
      console.error('[Payment Approve] Update failed:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase.from('activity').insert({
      icon: 'ti-check',
      color: '#DCFCE7',
      icon_color: '#16A34A',
      text: `Payment ${id} was approved`,
    });

    return NextResponse.redirect(new URL('/dashboard/landlord', req.url));
  } catch (err) {
    console.error('[Payment Approve] Error:', err);
    return NextResponse.json(
      { error: (err as Error).message || 'Approval failed' },
      { status: 500 }
    );
  }
}
