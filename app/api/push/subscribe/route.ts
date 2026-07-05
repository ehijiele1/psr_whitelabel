import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subscription } = await req.json();
    if (!subscription?.endpoint) {
      return NextResponse.json({ error: 'Invalid subscription object' }, { status: 400 });
    }

    const endpoint = subscription.endpoint;
    const p256dh = subscription.keys?.p256dh || '';
    const auth = subscription.keys?.auth || '';

    const { data: existing } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .eq('endpoint', endpoint)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('push_subscriptions')
        .update({ endpoint, p256dh, auth, user_agent: req.headers.get('user-agent') || null })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('push_subscriptions')
        .insert({ user_id: user.id, endpoint, p256dh, auth, user_agent: req.headers.get('user-agent') || null });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Push Subscribe] Error:', err);
    return NextResponse.json({ error: (err as Error).message || 'Subscription failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { endpoint } = await req.json();
    if (!endpoint) {
      return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
    }

    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('endpoint', endpoint);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Push Unsubscribe] Error:', err);
    return NextResponse.json({ error: (err as Error).message || 'Unsubscribe failed' }, { status: 500 });
  }
}