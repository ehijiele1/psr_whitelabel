import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/clientFactory';
import { createPlan } from '@/lib/paystack-server'
import { requireRole } from '@/lib/auth/require-role';
import { subscriptionPlanSchema, validateSchema } from '@/lib/schemas';
import { csrfProtection } from '@/lib/csrf';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: plans } = await supabase
      .from('subscription_plans')
      .select('*, properties(name)')
      .eq('is_active', true)
      .order('name');

    return NextResponse.json({ plans: plans || [] });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

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
    const user = auth.user;
    const supabase = await createClient();

    const bodyData = await req.json();
    
    // Validate using Zod schema
    const validation = validateSchema(subscriptionPlanSchema, bodyData);
    if (!validation.success || !validation.data) {
      return NextResponse.json({ error: validation.error || 'Invalid data' }, { status: 400 });
    }

    const { property_id, name, amount, interval } = validation.data;

    const { data: property } = await supabase
      .from('properties')
      .select('landlord_id')
      .eq('id', property_id)
      .single();

    if (!property || property.landlord_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const paystackPlan = await createPlan({ name, amount, interval });
    if (!paystackPlan.plan_code) {
      return NextResponse.json({ error: 'Failed to create plan on Paystack' }, { status: 500 });
    }

    const { data: dbPlan, error } = await supabase
      .from('subscription_plans')
      .insert({
        property_id,
        name,
        amount,
        interval,
        plan_code: paystackPlan.plan_code,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ plan: dbPlan });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}