import { env } from '@/src/lib/env';

const EBULK_API_URL = 'https://api.ebulksms.com/v2/sms/send';
const SENDER = 'PrinceSteve';

async function sendSms(
  phone: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  if (!env.ebulkSmsUsername || !env.ebulkSmsApiKey) {
    console.warn('[SMS] eBulk SMS credentials not configured. Skipping SMS.');
    return { success: false, error: 'SMS not configured' };
  }

  const normalizedPhone = phone.startsWith('0')
    ? `234${phone.slice(1)}`
    : phone.startsWith('+')
    ? phone.slice(1)
    : phone;

  if (!/^234\d{10}$/.test(normalizedPhone)) {
    return { success: false, error: `Invalid phone format: ${phone}` };
  }

  try {
    const response = await fetch(EBULK_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        username: env.ebulkSmsUsername,
        apikey: env.ebulkSmsApiKey,
        sender: SENDER,
        message,
        recipients: [normalizedPhone],
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[SMS] API error:', result);
      return { success: false, error: result?.error || result?.message || `HTTP ${response.status}` };
    }

    return { success: true };
  } catch (err) {
    console.error('[SMS] Network error:', err);
    return { success: false, error: (err as Error).message || 'Network error' };
  }
}

export async function sendInviteSms(
  phone: string,
  tenantName: string,
  inviteUrl: string
): Promise<{ success: boolean; error?: string }> {
  return sendSms(
    phone,
    `Dear ${tenantName}, you have been invited to join PrinceSteve Residence. Click here to complete your registration: ${inviteUrl}`
  );
}

export async function sendRentReminder(
  phone: string,
  tenantName: string,
  amount: number,
  dueDate: string
): Promise<{ success: boolean; error?: string }> {
  return sendSms(
    phone,
    `Dear ${tenantName}, this is a reminder that your rent of ₦${amount.toLocaleString()} is due on ${dueDate}. Please make payment to avoid late fees. - PrinceSteve Residence`
  );
}

export async function sendPaymentConfirmation(
  phone: string,
  tenantName: string,
  amount: number,
  reference: string
): Promise<{ success: boolean; error?: string }> {
  return sendSms(
    phone,
    `Dear ${tenantName}, your payment of ₦${amount.toLocaleString()} (Ref: ${reference}) has been received. Thank you! - PrinceSteve Residence`
  );
}

export async function sendTicketUpdate(
  phone: string,
  tenantName: string,
  ticketId: string,
  status: string
): Promise<{ success: boolean; error?: string }> {
  return sendSms(
    phone,
    `Dear ${tenantName}, your ticket ${ticketId} has been updated to "${status}". - PrinceSteve Residence`
  );
}

export async function sendApplicationApproved(
  phone: string,
  tenantName: string
): Promise<{ success: boolean; error?: string }> {
  return sendSms(
    phone,
    `Congratulations ${tenantName}! Your PrinceSteve Residence application has been approved. Please log in to your portal to review and sign your lease agreement.`
  );
}

export async function sendApplicationRejected(
  phone: string,
  tenantName: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  return sendSms(
    phone,
    `Dear ${tenantName}, your PrinceSteve Residence application has been reviewed.${reason ? ` Reason: ${reason}` : ''} Please contact management for more details.`
  );
}

export async function sendApplicationReceived(
  phone: string,
  tenantName: string
): Promise<{ success: boolean; error?: string }> {
  return sendSms(
    phone,
    `Dear ${tenantName}, your PrinceSteve Residence application has been received. We will review and get back to you shortly.`
  );
}

export async function sendAgreementSigned(
  phone: string,
  tenantName: string
): Promise<{ success: boolean; error?: string }> {
  return sendSms(
    phone,
    `Dear ${tenantName}, your tenancy agreement has been signed successfully. The landlord will review and activate your dashboard access soon. - PrinceSteve Residence`
  );
}