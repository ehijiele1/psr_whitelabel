import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/server';
import { env } from '@/lib/env';

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
    const { error } = await client.emails.send({
      from: env.emailFrom,
      to: payload.to,
      subject: payload.subject,
      html: payload.html || "",
      text: payload.text || "",
    });
    if (error) {
      console.error('[Email] Resend error:', error);
    }
  } else {
    console.warn('[Email] RESEND_API_KEY not set — email not sent');
  }

  const supabase = await createAdminClient();
  const { error: queueError } = await supabase.from('email_queue').insert({
    to_address: payload.to,
    subject: payload.subject,
    html_body: payload.html,
    text_body: payload.text,
    status: client ? 'sent' : 'pending',
    retry_count: 0,
  });
  if (queueError) console.error('[Email] Queue error:', queueError);

  if (!client) return { ok: false, error: 'RESEND_API_KEY not configured' };
  return { ok: true };
}

export async function sendEmailViaEdge(...args: unknown[]) {
  console.warn('[Email] Edge send not implemented', args);
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
