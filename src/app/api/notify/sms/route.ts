import { NextRequest, NextResponse } from 'next/server';
import {
  sendApplicationReceived,
  sendPaymentConfirmation,
  sendAgreementSigned,
} from '@/lib/notifications/sms'
import { requireRole } from '@/lib/auth/require-role';

type SmsAction = 'application-received' | 'payment-confirmed' | 'agreement-signed';

const ACTION_MAP: Record<SmsAction, (phone: string, name: string) => Promise<{ success: boolean; error?: string }>> = {
  'application-received': (phone, name) => sendApplicationReceived(phone, name),
  'payment-confirmed': (phone, name) => sendPaymentConfirmation(phone, name, 0, ''),
  'agreement-signed': (phone, name) => sendAgreementSigned(phone, name),
};

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(['landlord', 'caretaker']);
    if (!auth.ok) return auth.response;

    const { action, phone, name, amount, reference } = await req.json();

    if (!action || !phone || !name) {
      return NextResponse.json({ error: 'Missing required fields: action, phone, name' }, { status: 400 });
    }

    if (typeof phone !== 'string' || !/^\+?\d{7,15}$/.test(phone.replace(/\s/g, ''))) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
    }

    if (!(action in ACTION_MAP)) {
      return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 });
    }

    let result: { success: boolean; error?: string };

    if (action === 'payment-confirmed') {
      result = await sendPaymentConfirmation(phone, name, amount || 0, reference || '');
    } else {
      result = await ACTION_MAP[action as SmsAction](phone, name);
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'SMS failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[SMS API] Error:', err);
    return NextResponse.json({ error: (err as Error).message || 'Internal error' }, { status: 500 });
  }
}