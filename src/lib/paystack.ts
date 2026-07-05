import { PaystackInitResponse } from '../lib/types';

const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!;
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;

export function getPaystackScript() {
  return 'https://js.paystack.co/v1/inline.js';
}

export interface PaystackInitOptions {
  email: string;
  amount: number; // in naira
  reference?: string;
  metadata?: Record<string, unknown>;
  callback?: (response: { reference: string; transaction?: string; status: string }) => void;
  onClose?: () => void;
}

export function initPaystackPop(options: PaystackInitOptions) {
  const handler = (window as any).PaystackPop?.setup({
    key: PAYSTACK_PUBLIC_KEY,
    email: options.email,
    amount: options.amount * 100, // Convert to kobo
    currency: 'NGN',
    ref: options.reference || `PSR-${Date.now()}`,
    metadata: options.metadata,
    callback: options.callback,
    onClose: options.onClose,
  });

  handler?.openIframe();
}

export async function initializeTransaction(options: {
  email: string;
  amount: number;
  reference?: string;
  metadata?: Record<string, unknown>;
}): Promise<PaystackInitResponse> {
  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: options.email,
      amount: options.amount * 100,
      reference: options.reference,
      metadata: options.metadata,
      currency: 'NGN',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to initialize Paystack transaction');
  }

  const data = await response.json();
  return data.data;
}

export async function verifyTransaction(reference: string): Promise<{
  status: string;
  amount: number;
  currency: string;
  paid_at: string;
  customer_email: string;
  metadata?: Record<string, unknown>;
}> {
  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to verify Paystack transaction');
  }

  const data = await response.json();
  return data.data;
}

// ── Subscription / Plan Management ──────────────────────────────

export async function createPlan(options: {
  name: string;
  amount: number; // in naira
  interval: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'biannually' | 'annually';
  description?: string;
  send_invoices?: boolean;
  send_sms?: boolean;
  currency?: string;
}): Promise<{ plan_code: string; id: number; name: string }> {
  const response = await fetch('https://api.paystack.co/plan', {
    method: 'POST',
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: options.name,
      amount: options.amount * 100,
      interval: options.interval,
      description: options.description,
      send_invoices: options.send_invoices ?? true,
      send_sms: options.send_sms ?? true,
      currency: options.currency || 'NGN',
    }),
  });
  if (!response.ok) throw new Error('Failed to create Paystack plan');
  const data = await response.json();
  return { plan_code: data.data.plan_code, id: data.data.id, name: data.data.name };
}

export async function listPlans(): Promise<{ plan_code: string; name: string; amount: number; interval: string; status: string }[]> {
  const response = await fetch('https://api.paystack.co/plan?perPage=100', {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
  });
  if (!response.ok) throw new Error('Failed to fetch Paystack plans');
  const data = await response.json();
  return (data.data || []).map((p: any) => ({
    plan_code: p.plan_code,
    name: p.name,
    amount: p.amount / 100,
    interval: p.interval,
    status: p.status,
    id: p.id,
  }));
}

export async function initializeSubscription(options: {
  email: string;
  amount: number;
  plan: string;
  metadata?: Record<string, unknown>;
}): Promise<PaystackInitResponse> {
  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: options.email,
      amount: options.amount * 100,
      plan: options.plan,
      metadata: options.metadata,
      currency: 'NGN',
    }),
  });
  if (!response.ok) throw new Error('Failed to initialize Paystack subscription');
  const data = await response.json();
  return data.data;
}

export async function listSubscriptions(): Promise<{
  subscription_code: string;
  status: string;
  plan: { name: string; amount: number; interval: string };
  next_payment_date: string;
}[]> {
  const response = await fetch('https://api.paystack.co/subscription?perPage=100', {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
  });
  if (!response.ok) throw new Error('Failed to fetch subscriptions');
  const data = await response.json();
  return (data.data || []).map((s: any) => ({
    subscription_code: s.subscription_code,
    status: s.status,
    plan: { name: s.plan.name, amount: s.plan.amount / 100, interval: s.plan.interval },
    next_payment_date: s.next_payment_date,
  }));
}

export async function enableSubscription(code: string): Promise<void> {
  const token = (await fetch('https://api.paystack.co/subscription/' + code, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
  }).then(r => r.json())).data?.email_token;
  if (!token) throw new Error('No email token found');
  await fetch('https://api.paystack.co/subscription/enable', {
    method: 'POST',
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, token }),
  });
}

export async function disableSubscription(code: string): Promise<void> {
  const token = (await fetch('https://api.paystack.co/subscription/' + code, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
  }).then(r => r.json())).data?.email_token;
  if (!token) throw new Error('No email token found');
  await fetch('https://api.paystack.co/subscription/disable', {
    method: 'POST',
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, token }),
  });
}

export async function listBanks(country: string = 'nigeria') {
  const response = await fetch(
    `https://api.paystack.co/bank?country=${country}`,
    {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch banks');
  }

  const data = await response.json();
  return data.data;
}

export async function validateAccountNumber(accountNumber: string, bankCode: string) {
  const response = await fetch(
    `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
    {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    }
  );

  if (!response.ok) {
    return { valid: false, error: 'Invalid account number or bank code' };
  }

  const data = await response.json();
  return { valid: true, ...data.data };
}