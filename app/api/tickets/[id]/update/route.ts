import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formData = await req.formData();
    const status = formData.get('status') as string;

    if (!status || !['pending', 'in-progress', 'resolved'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const updateData: Record<string, string> = { status };
    if (status === 'resolved') {
      const { data: { user } } = await supabase.auth.getUser();
      updateData.resolved_by = user?.id || '';
    }

    const { error } = await supabase
      .from('tickets')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('[Ticket Update] Failed:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.redirect(new URL('/dashboard/caretaker', req.url));
  } catch (err) {
    console.error('[Ticket Update] Error:', err);
    return NextResponse.json(
      { error: (err as Error).message || 'Update failed' },
      { status: 500 }
    );
  }
}
