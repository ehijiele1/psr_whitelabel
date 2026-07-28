import { Resend } from 'resend';
import { fetchWithRetry } from '@/lib/fetch';
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

const RESEND_API_URL = 'https://api.resend.com'
const RESEND_TIMEOUT = 10000 // 10 seconds

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

// Alternative sendEmail using fetch directly (for reference)
export async function sendEmailDirect(payload: EmailPayload): Promise<{ ok: boolean; error?: string }> {
  if (!env.resendApiKey) {
    return { ok: false, error: 'RESEND_API_KEY not configured' };
  }

  try {
    const response = await fetchWithRetry(
      `${RESEND_API_URL}/emails`,
      {
        method: 'POST',
        timeout: RESEND_TIMEOUT,
        maxRetries: 3,
        retryDelay: 1000,
        headers: {
          Authorization: `Bearer ${env.resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: env.emailFrom,
          to: payload.to,
          subject: payload.subject,
          html: payload.html || "",
          text: payload.text || "",
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return { ok: false, error: errorData.error || errorData.message || 'Failed to send email' };
    }

    return { ok: true };
  } catch (err) {
    console.error('[Email] Direct send error:', err);
    return { ok: false, error: (err as Error).message };
  }
}

export async function notifyApplicationReceived(data: { name: string; email?: string }) {
  if (data.email) {
    await sendEmail({ to: data.email, subject: 'Application Received', text: `Dear ${data.name}, your application has been received.` });
  }
}

export async function notifyApplicationApproved(data: { name: string; email?: string }) {
  if (data.email) {
    await sendEmail({ to: data.email, subject: 'Application Approved', text: `Dear ${data.name}, your application has been approved.` });
  }
}

export async function notifyApplicationRejected(data: { name: string; email?: string }) {
  if (data.email) {
    await sendEmail({ to: data.email, subject: 'Application Update', text: `Dear ${data.name}, your application was not approved.` });
  }
}

export async function notifyLeaseReady(data: { name: string; email?: string }) {
  if (data.email) {
    await sendEmail({ to: data.email, subject: 'Lease Ready', text: `Dear ${data.name}, your lease agreement is ready for signing.` });
  }
}

export async function notifyLeaseFinalized(data: { name: string; email?: string }) {
  if (data.email) {
    await sendEmail({ to: data.email, subject: 'Lease Finalized', text: `Dear ${data.name}, your lease has been finalized.` });
  }
}

export async function notifyPaymentReceived(data: { name: string; email?: string; amount?: number }) {
  if (data.email) {
    await sendEmail({ to: data.email, subject: 'Payment Received', text: `Dear ${data.name}, your payment of ${data.amount} has been received.` });
  }
}

export async function notifyRentReminder(data: { name: string; email?: string; amount?: number; dueDate?: string }) {
  if (data.email) {
    await sendEmail({ to: data.email, subject: 'Rent Reminder', text: `Dear ${data.name}, your rent of ${data.amount} is due on ${data.dueDate}.` });
  }
}

export async function notifyTicketUpdate(data: { name: string; email?: string; ticketId?: string; status?: string }) {
  if (data.email) {
    await sendEmail({ to: data.email, subject: 'Ticket Update', text: `Dear ${data.name}, your ticket ${data.ticketId} is now ${data.status}.` });
  }
}

export const emails = {
  applicationReceived: notifyApplicationReceived,
  applicationApproved: notifyApplicationApproved,
  applicationRejected: notifyApplicationRejected,
  leaseReady: notifyLeaseReady,
  leaseFinalized: notifyLeaseFinalized,
  paymentReceived: notifyPaymentReceived,
  rentReminder: notifyRentReminder,
  ticketUpdate: notifyTicketUpdate,
};
