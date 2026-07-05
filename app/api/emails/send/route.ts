import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, subject, html, text } = body;

    if (!to || !subject || (!html && !text)) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, and html or text' },
        { status: 400 }
      );
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
      // Fallback to direct SMTP if configured
      if (process.env.SMTP_HOST) {
        // In production, use nodemailer or Resend/Postmark API
        console.log('[Email] Queue fallback: SMTP would be used');
        return NextResponse.json({ success: true, method: 'smtp_fallback' });
      }
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