import { createAdminClient } from '@/lib/supabase/server';

interface EmailPayload {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

export async function sendEmail(payload: EmailPayload) {
  const supabase = await createAdminClient();
  const { error } = await supabase.from('email_queue').insert({
    to_address: payload.to,
    subject: payload.subject,
    html_body: payload.html,
    text_body: payload.text,
    status: 'pending',
    retry_count: 0,
  });
  if (error) console.error('[Email] Queue error:', error);
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
