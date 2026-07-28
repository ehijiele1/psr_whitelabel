import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/clientFactory';
import { requireRole } from '@/lib/auth/require-role';
import { emailSendSchema, validateSchema } from '@/lib/schemas';
import { csrfProtection } from '@/lib/csrf';

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
    const auth = await requireRole(['landlord', 'caretaker']);
    if (!auth.ok) return auth.response;

    const body = await req.json();
    
    // Validate using Zod schema
    const validation = validateSchema(emailSendSchema, body);
    if (!validation.success || !validation.data) {
      return NextResponse.json({ error: validation.error || 'Invalid data' }, { status: 400 });
    }

    const { to, subject, html, text } = validation.data;

    // Use regular client with RLS - email_queue should have proper RLS policies
    const supabase = await createClient();
    const { error } = await supabase.from('email_queue').insert({
      to,
      subject,
      html_body: html || text,
      text_body: text || html?.replace(/<[^>]*>/g, '') || '',
      status: 'pending',
      created_at: new Date().toISOString(),
      created_by: auth.user.id,
    });

    if (error) {
      console.error('[Email] Failed to queue:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, method: 'queued' });
  } catch (err) {
    console.error('[Email] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}