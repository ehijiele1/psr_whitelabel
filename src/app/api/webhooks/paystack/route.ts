import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/clientFactory'

// ── Types ────────────────────────────────────────────────────────────────

interface PaystackEvent<T = Record<string, unknown>> {
  event: string
  data: T
}

interface ChargeData {
  reference: string
  amount: number
  paid_at: string
  metadata?: Record<string, any>
  subscription_code?: string
}

interface SubscriptionData {
  subscription_code: string
  plan?: { plan_code: string }
  customer?: { email: string }
  metadata?: { subscription_id?: string }
}

interface InvoiceData {
  next_payment_date?: string
  subscription?: { subscription_code: string }
}

type EventHandler = (data: any) => Promise<NextResponse>

// ── Event Dispatcher Map ─────────────────────────────────────────────────

const EVENT_HANDLERS: Record<string, EventHandler> = {
  'charge.success': handleChargeSuccess,
  'subscription.create': handleSubscriptionCreate,
  'invoice.create': handleInvoiceUpdate,
  'invoice.update': handleInvoiceUpdate,
}

// ── Signature Verification ───────────────────────────────────────────────

function verifyPaystackSignature(body: string, signature: string, secret: string): boolean {
  const hash = crypto.createHmac('sha512', secret).update(body).digest('hex')
  const hashBuf = Buffer.from(hash)
  const sigBuf = Buffer.from(signature)
  if (hashBuf.length !== sigBuf.length) return false
  return crypto.timingSafeEqual(hashBuf, sigBuf)
}

// ── Event Handlers ───────────────────────────────────────────────────────

async function handleChargeSuccess(data: ChargeData) {
  const supabase = await createAdminClient()
  const { reference, amount, paid_at, metadata } = data
  const amountNaira = amount / 100

  // Idempotency: skip if already processed
  if (reference) {
    const { data: existing } = await supabase
      .from('payments')
      .select('id')
      .eq('paystack_ref', reference)
      .maybeSingle()
    if (existing) return NextResponse.json({ received: true, duplicate: true })
  }

  // Subscription payment
  if (data.subscription_code) {
    await recordSubscriptionPayment(supabase, data, amountNaira)
    return NextResponse.json({ received: true })
  }

  // Application payment
  if (metadata?.is_application && metadata.applicant_id) {
    await recordApplicationPayment(supabase, metadata.applicant_id, reference, amountNaira, paid_at)
    return NextResponse.json({ received: true })
  }

  // Tenant rent payment
  if (metadata?.tenant_id) {
    await recordTenantPayment(supabase, metadata, reference, amountNaira, paid_at)
  }

  return NextResponse.json({ received: true })
}

async function handleSubscriptionCreate(data: SubscriptionData) {
  const supabase = await createAdminClient()
  const subCode = data.subscription_code
  const subscriptionId = data.metadata?.subscription_id

  if (subCode && subscriptionId) {
    await supabase
      .from('tenant_subscriptions')
      .update({ subscription_code: subCode, status: 'active' })
      .eq('id', subscriptionId)
  }

  return NextResponse.json({ received: true })
}

async function handleInvoiceUpdate(data: InvoiceData) {
  const supabase = await createAdminClient()
  const nextPaymentDate = data.next_payment_date?.split('T')[0]
  const subCode = data.subscription?.subscription_code

  if (subCode && nextPaymentDate) {
    await supabase
      .from('tenant_subscriptions')
      .update({ next_payment_date: nextPaymentDate })
      .eq('subscription_code', subCode)
  }

  return NextResponse.json({ received: true })
}

// ── Database Operations ──────────────────────────────────────────────────

async function recordSubscriptionPayment(supabase: any, data: any, amountNaira: number) {
  const subCode = data.subscription_code
  const paidAt = data.paid_at?.split('T')[0]

  const { data: sub } = await supabase
    .from('tenant_subscriptions')
    .select('*, tenants(name, unit, property_id)')
    .eq('subscription_code', subCode)
    .maybeSingle()

  if (!sub) return

  await supabase.from('payments').insert({
    tenant_id: sub.tenant_id,
    tenant_name: sub.tenants?.name || 'Unknown',
    unit: sub.tenants?.unit || '',
    property_id: sub.property_id,
    type: 'rent',
    amount: amountNaira,
    method: 'paystack',
    date: paidAt,
    status: 'approved',
    paystack_ref: data.reference,
    is_partial: false,
    subscription_id: sub.id,
  })

  await supabase
    .from('tenant_subscriptions')
    .update({ last_payment_date: paidAt })
    .eq('id', sub.id)

  await supabase.from('activity').insert({
    icon: 'ti-refresh',
    color: '#DBEAFE',
    icon_color: '#2563EB',
    text: `Subscription payment of ₦${amountNaira.toLocaleString('en-NG')} received from ${sub.tenants?.name || 'tenant'}`,
  })
}

async function recordApplicationPayment(
  supabase: any,
  applicantId: string,
  reference: string,
  amountNaira: number,
  paidAt: string
) {
  const { error } = await supabase
    .from('applicants')
    .update({
      payment_status: 'paid',
      payment_ref: reference,
      payment_amount: amountNaira,
      payment_date: paidAt.split('T')[0],
      payment_method: 'paystack',
      stage: 'payment-confirmed',
    })
    .eq('id', applicantId)

  if (error) console.error('[Paystack] Applicant update failed:', error)

  await supabase.from('inbox').insert({
    type: 'proof',
    from_name: 'Paystack System',
    subject: `Application payment confirmed — ₦${amountNaira.toLocaleString('en-NG')}`,
    preview: `Paystack reference: ${reference}. Applicant ID: ${applicantId}`,
    read: false,
  })
}

async function recordTenantPayment(
  supabase: any,
  metadata: Record<string, any>,
  reference: string,
  amountNaira: number,
  paidAt: string
) {
  const { data: tenant } = await supabase
    .from('tenants')
    .select('name, unit, type, property_id')
    .eq('id', metadata.tenant_id)
    .single()

  if (!tenant) {
    console.error('[Paystack] Tenant not found:', metadata.tenant_id)
    return
  }

  const cycleStart = metadata?.cycle_start as string | undefined
  const cycleEnd = metadata?.cycle_end as string | undefined
  const period = cycleStart && cycleEnd ? `${cycleStart} to ${cycleEnd}` : (cycleStart || null)

  const { error } = await supabase.from('payments').insert({
    tenant_id: metadata.tenant_id,
    tenant_name: tenant.name,
    unit: tenant.unit,
    property_id: tenant.property_id,
    type: (metadata.payment_type as 'rent' | 'levy') ?? 'rent',
    amount: amountNaira,
    method: 'paystack',
    date: paidAt.split('T')[0],
    period,
    status: 'approved',
    paystack_ref: reference,
    is_partial: false,
  })

  if (error) {
    console.error('[Paystack] Payment insert failed:', error)
    return
  }

  await supabase.from('activity').insert({
    icon: 'ti-credit-card',
    color: '#DCFCE7',
    icon_color: '#16A34A',
    text: `Paystack payment of ₦${amountNaira.toLocaleString('en-NG')} received from ${tenant.name}`,
  })
}

// ── Route Handler ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.text()

  const signature = req.headers.get('x-paystack-signature')
  const secret = process.env.PAYSTACK_SECRET_KEY

  if (!secret) {
    console.error('[Paystack Webhook] PAYSTACK_SECRET_KEY not configured')
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  if (!signature) {
    console.error('[Paystack Webhook] Missing signature header')
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
  }

  if (!verifyPaystackSignature(body, signature, secret)) {
    console.error('[Paystack Webhook] Signature mismatch - possible tampering attempt')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: PaystackEvent
  try {
    event = JSON.parse(body) as PaystackEvent
  } catch {
    console.error('[Paystack Webhook] Invalid JSON payload')
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const handler = EVENT_HANDLERS[event.event]
  if (!handler) {
    // Unknown events are acknowledged to prevent Paystack retries
    return NextResponse.json({ received: true, ignored: event.event })
  }

  try {
    return await handler(event.data)
  } catch (err) {
    console.error(`[Paystack Webhook] Handler error for ${event.event}:`, err)
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }
}
