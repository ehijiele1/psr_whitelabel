import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/clientFactory';
import { env } from '@/lib/env';
import { log, logAuditEvent } from '@/lib/logger';

interface EmailPayload {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

let resend: Resend | null = null;
function getResend() {
  if (!resend && env.resendApiKey) {
    resend = new Resend(env.resendApiKey);
  }
  return resend;
}

export async function sendEmail(payload: EmailPayload): Promise<{ ok: boolean; error?: string }> {
  const client = getResend();

  if (client) {
    try {
      const { error } = await client.emails.send({
        from: env.emailFrom,
        to: payload.to,
        subject: payload.subject,
        html: payload.html || "",
        text: payload.text || "",
      });
      if (error) {
        log.error('[Email] Resend error', {
          error: error.message,
          to: payload.to,
          subject: payload.subject,
        });
        return { ok: false, error: error.message };
      }
      
      // Log successful email send to audit log
      logAuditEvent('email_sent', {
        targetType: 'email',
        targetId: payload.to,
        status: 'success',
      });
    } catch (err) {
      log.error('[Email] Resend exception', {
        error: err,
        to: payload.to,
        subject: payload.subject,
      });
      return { ok: false, error: (err as Error).message };
    }
  } else {
    log.warn('[Email] RESEND_API_KEY not set — email not sent', {
      to: payload.to,
      subject: payload.subject,
    });
  }

  // Use regular client with RLS - email_queue should have proper RLS policies
  const supabase = await createClient();
  const { error: queueError } = await supabase.from('email_queue').insert({
    to_address: payload.to,
    subject: payload.subject,
    html_body: payload.html,
    text_body: payload.text,
    status: client ? 'sent' : 'pending',
    retry_count: 0,
  });
  if (queueError) {
    log.error('[Email] Queue error', {
      error: queueError.message,
      to: payload.to,
      subject: payload.subject,
    });
    return { ok: false, error: queueError.message };
  }

  if (!client) return { ok: false, error: 'RESEND_API_KEY not configured' };
  return { ok: true };
}
