import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { initializeSubscription, disableSubscription, enableSubscription } from '@/src/lib/paystack';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { action, plan_id, tenant_id, subscription_id } = await req.json();

    if (action === 'subscribe') {
      const { data: plan } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', plan_id)
        .single();

      if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });

      const { data: tenant } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenant_id)
        .single();

      if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

      const { data: sub, error: subErr } = await supabase
        .from('tenant_subscriptions')
        .insert({
          tenant_id,
          plan_id: plan.id,
          property_id: plan.property_id,
          amount: plan.amount,
          interval: plan.interval,
        })
        .select()
        .single();

      if (subErr) return NextResponse.json({ error: subErr.message }, { status: 500 });

      const initResult = await initializeSubscription({
        email: tenant.email || `${tenant.phone}@princesteve.ng`,
        amount: plan.amount,
        plan: plan.plan_code,
        metadata: { subscription_id: sub.id, tenant_id, plan_id },
      });

      return NextResponse.json({
        authorization_url: initResult.authorization_url,
        reference: initResult.reference,
        subscription_id: sub.id,
      });
    }

    if (action === 'cancel' && subscription_id) {
      const { data: sub } = await supabase
        .from('tenant_subscriptions')
        .select('*')
        .eq('id', subscription_id)
        .single();

      if (!sub) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });

      if (sub.subscription_code) {
        await disableSubscription(sub.subscription_code).catch(() => {});
      }

      await supabase.from('tenant_subscriptions').update({ status: 'cancelled' }).eq('id', subscription_id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}