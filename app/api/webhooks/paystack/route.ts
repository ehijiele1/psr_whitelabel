import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const body = await req.text();

  const signature = req.headers.get('x-paystack-signature');
  const secret    = process.env.PAYSTACK_SECRET_KEY;

  if (!secret || !signature) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 401 });
  }

  const hash = crypto
    .createHmac('sha512', secret)
    .update(body)
    .digest('hex');

  if (hash !== signature) {
    console.error('[Paystack Webhook] Signature mismatch');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: Record<string, any>;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { event: eventType, data } = event;
  const supabase = createAdminClient();

  // ── charge.success ────────────────────────────────────────────
  if (eventType === 'charge.success') {
    const { reference, amount, paid_at, metadata } = data;
    const amountNaira = amount / 100;

    if (data.subscription_code) {
      return await handleSubscriptionPayment(supabase, data, amountNaira);
    }

    if (metadata?.is_application && metadata.applicant_id) {
      const { error } = await supabase
        .from('applicants')
        .update({
          payment_status: 'paid',
          payment_ref:    reference,
          payment_amount: amountNaira,
          payment_date:   paid_at.split('T')[0],
          payment_method: 'paystack',
          stage:          'payment-confirmed',
        })
        .eq('id', metadata.applicant_id);

      if (error) console.error('[Paystack] Applicant update failed:', error);

      await supabase.from('inbox').insert({
        type:      'proof',
        from_name: 'Paystack System',
        subject:   `Application payment confirmed — ₦${amountNaira.toLocaleString('en-NG')}`,
        preview:   `Paystack reference: ${reference}. Applicant ID: ${metadata.applicant_id}`,
        read:      false,
      });

      return NextResponse.json({ received: true });
    }

    if (metadata?.tenant_id) {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('name, unit, type, property_id')
        .eq('id', metadata.tenant_id)
        .single();

      if (!tenant) {
        return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
      }

      const { error } = await supabase.from('payments').insert({
        tenant_id:    metadata.tenant_id,
        tenant_name:  tenant.name,
        unit:         tenant.unit,
        property_id:  tenant.property_id,
        type:         (metadata.payment_type as 'rent' | 'levy') ?? 'rent',
        amount:       amountNaira,
        method:       'paystack',
        date:         paid_at.split('T')[0],
        status:       'approved',
        paystack_ref: reference,
        is_partial:   false,
      });

      if (error) {
        console.error('[Paystack] Payment insert failed:', error);
        return NextResponse.json({ error: 'DB insert failed' }, { status: 500 });
      }

      await supabase.from('activity').insert({
        icon:       'ti-credit-card',
        color:      '#DCFCE7',
        icon_color: '#16A34A',
        text:       `Paystack payment of ₦${amountNaira.toLocaleString('en-NG')} received from ${tenant.name}`,
      });
    }

    return NextResponse.json({ received: true });
  }

  // ── subscription.create ───────────────────────────────────────
  if (eventType === 'subscription.create') {
    const subCode = data.subscription_code;
    const planCode = data.plan?.plan_code;
    const customerEmail = data.customer?.email;

    if (subCode && planCode) {
      await supabase
        .from('tenant_subscriptions')
        .update({ subscription_code: subCode, status: 'active' })
        .eq('id', data.metadata?.subscription_id);
    }

    return NextResponse.json({ received: true });
  }

  // ── invoice.create / invoice.update ───────────────────────────
  if (eventType === 'invoice.create' || eventType === 'invoice.update') {
    const nextPaymentDate = data.next_payment_date?.split('T')[0];
    const subCode = data.subscription?.subscription_code;

    if (subCode && nextPaymentDate) {
      await supabase
        .from('tenant_subscriptions')
        .update({ next_payment_date: nextPaymentDate })
        .eq('subscription_code', subCode);
    }

    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true });
}

async function handleSubscriptionPayment(supabase: any, data: any, amountNaira: number) {
  const subCode = data.subscription_code;
  const paidAt = data.paid_at?.split('T')[0];

  const { data: sub } = await supabase
    .from('tenant_subscriptions')
    .select('*, tenants(name, unit, property_id)')
    .eq('subscription_code', subCode)
    .single();

  if (!sub) return NextResponse.json({ received: true });

  await supabase.from('payments').insert({
    tenant_id:        sub.tenant_id,
    tenant_name:      sub.tenants?.name || 'Unknown',
    unit:             sub.tenants?.unit || '',
    property_id:      sub.property_id,
    type:             'rent',
    amount:           amountNaira,
    method:           'paystack',
    date:             paidAt,
    status:           'approved',
    paystack_ref:     data.reference,
    is_partial:       false,
    subscription_id:  sub.id,
  });

  await supabase
    .from('tenant_subscriptions')
    .update({ last_payment_date: paidAt })
    .eq('id', sub.id);

  await supabase.from('activity').insert({
    icon:       'ti-refresh',
    color:      '#DBEAFE',
    icon_color: '#2563EB',
    text:       `Subscription payment of ₦${amountNaira.toLocaleString('en-NG')} received from ${sub.tenants?.name || 'tenant'}`,
  });

  return NextResponse.json({ received: true });
}