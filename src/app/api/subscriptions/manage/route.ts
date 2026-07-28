import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/clientFactory';
import { initializeSubscription, disableSubscription, enableSubscription } from '@/lib/paystack-server'
import { requireRole } from '@/lib/auth/require-role';
import { subscriptionManageSchema, validateSchema } from '@/lib/schemas';
import { csrfProtection } from '@/lib/csrf';

export async function POST(req: NextRequest) {
  // Apply CSRF protection
  const csrfResult = await csrfProtection(req);
  if (!csrfResult.valid) {
    return new NextResponse(
      JSON.stringify({ error: 'Invalid CSRF token' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const auth = await requireRole(['landlord']);
    if (!auth.ok) return auth.response;

    const supabase = await createClient();

    const bodyData = await req.json();
    
    // Validate using Zod schema
    const validation = validateSchema(subscriptionManageSchema, bodyData);
    if (!validation.success || !validation.data) {
      return NextResponse.json({ error: validation.error || 'Invalid data' }, { status: 400 });
    }

    const { action, plan_id, tenant_id, subscription_id } = validation.data;

    if (action === 'subscribe') {
      if (!plan_id || !tenant_id) {
        return NextResponse.json({ error: 'plan_id and tenant_id are required for subscribe action' }, { status: 400 });
      }

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

      const { data: ownedProperty } = await supabase
        .from('properties')
        .select('id')
        .eq('id', plan.property_id)
        .eq('landlord_id', auth.user.id)
        .maybeSingle();

      if (!ownedProperty) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const { data: sub, error: subErr } = await supabase
        .from('tenant_subscriptions')
        .insert({
          tenant_id,
          plan_id: plan.id,
          property_id: plan.property_id,
          amount: plan.amount,
          interval: plan.interval,
          created_by: auth.user.id,
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

      const { data: ownedProperty } = await supabase
        .from('properties')
        .select('id')
        .eq('id', sub.property_id)
        .eq('landlord_id', auth.user.id)
        .maybeSingle();

      if (!ownedProperty) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      if (sub.subscription_code) {
        await disableSubscription(sub.subscription_code).catch(() => {});
      }

      await supabase.from('tenant_subscriptions').update({ status: 'cancelled', updated_by: auth.user.id }).eq('id', subscription_id);
      return NextResponse.json({ success: true });
    }

    if (action === 'enable' && subscription_id) {
      const { data: sub } = await supabase
        .from('tenant_subscriptions')
        .select('*')
        .eq('id', subscription_id)
        .single();

      if (!sub) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });

      const { data: ownedProperty } = await supabase
        .from('properties')
        .select('id')
        .eq('id', sub.property_id)
        .eq('landlord_id', auth.user.id)
        .maybeSingle();

      if (!ownedProperty) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      if (sub.subscription_code) {
        await enableSubscription(sub.subscription_code).catch(() => {});
      }

      await supabase.from('tenant_subscriptions').update({ status: 'active', updated_by: auth.user.id }).eq('id', subscription_id);
      return NextResponse.json({ success: true });
    }

    if (action === 'disable' && subscription_id) {
      const { data: sub } = await supabase
        .from('tenant_subscriptions')
        .select('*')
        .eq('id', subscription_id)
        .single();

      if (!sub) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });

      const { data: ownedProperty } = await supabase
        .from('properties')
        .select('id')
        .eq('id', sub.property_id)
        .eq('landlord_id', auth.user.id)
        .maybeSingle();

      if (!ownedProperty) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      if (sub.subscription_code) {
        await disableSubscription(sub.subscription_code).catch(() => {});
      }

      await supabase.from('tenant_subscriptions').update({ status: 'inactive', updated_by: auth.user.id }).eq('id', subscription_id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('[Subscriptions Manage] Error:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}