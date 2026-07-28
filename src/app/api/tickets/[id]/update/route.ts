import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/clientFactory';
import { requireRole } from '@/lib/auth/require-role';
import { csrfProtection } from '@/lib/csrf';
import { ticketUpdateSchema, validateFormData } from '@/lib/schemas';

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
    const auth = await requireRole(['landlord', 'caretaker']);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const formData = await req.formData();
    
    // Validate form data using Zod schema
    const validation = await validateFormData(ticketUpdateSchema, formData);
    if (!validation.success || !validation.data) {
      return NextResponse.json({ error: validation.error || 'Invalid data' }, { status: 400 });
    }

    const { status } = validation.data;

    const supabase = await createClient();

    // Verify the ticket exists and belongs to the user's property
    const { data: ticket, error: fetchError } = await supabase
      .from('tickets')
      .select('id, property_id')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('[Ticket Update] Fetch failed:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Verify user has access to this property
    if (auth.user.role === 'caretaker') {
      // Caretakers should only update tickets for their assigned properties
      // This assumes caretakers have a property_id in their profile
      if (ticket.property_id !== auth.user.property_id) {
        return NextResponse.json({ error: 'Unauthorized - Ticket does not belong to your property' }, { status: 403 });
      }
    } else if (auth.user.role === 'landlord') {
      // Landlords should only update tickets for their own properties
      if (ticket.property_id !== auth.user.property_id) {
        return NextResponse.json({ error: 'Unauthorized - Ticket does not belong to your property' }, { status: 403 });
      }
    }

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