import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';
import { csrfProtection } from '@/lib/csrf';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string> } }
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
    const auth = await requireRole(['landlord', 'caretaker']);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const formData = await req.formData();
    const status = formData.get('status') as string;

    if (!status || !['pending', 'in-progress', 'resolved'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const supabase = await createAdminClient();

    const updateData: Record<string, string> = { status };
    if (status === 'resolved') {
      updateData.resolved_by = auth.user.id;
    }

    const { error } = await supabase
      .from('tickets')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('[Ticket Update] Failed:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Ticket Update] Error:', err);
    return NextResponse.json(
      { error: (err as Error).message || 'Update failed' },
      { status: 500 }
    );
  }
}