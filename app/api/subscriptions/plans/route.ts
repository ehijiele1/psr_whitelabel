import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { createPlan, listPlans } from '@/src/lib/paystack';

export async function GET() {
  try {
    const supabase = await createAdminClient();
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
  try {
    const supabase = await createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { property_id, name, amount, interval } = await req.json();

    if (!property_id || !name || !amount || !interval) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

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
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ plan: dbPlan });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}