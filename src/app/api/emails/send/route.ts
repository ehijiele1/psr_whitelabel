import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(['landlord', 'caretaker']);
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const { to, subject, html, text } = body;

    if (!to || !subject || (!html && !text)) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, and html or text' },
        { status: 400 }
      );
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (typeof to !== 'string' || !emailPattern.test(to)) {
      return NextResponse.json({ error: 'Invalid recipient email' }, { status: 400 });
    }

    // Attempt to send via Supabase email_queue
    const supabase = await createAdminClient();
    const { error } = await supabase.from('email_queue').insert({
      to,
      subject,
      html_body: html || text,
      text_body: text || html?.replace(/<[^>]*>/g, '') || '',
      status: 'pending',
      created_at: new Date().toISOString(),
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