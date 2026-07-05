import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendPushNotification } from '@/src/lib/push';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, body, data: payloadData, userId } = await req.json();

    if (!title || !body) {
      return NextResponse.json({ error: 'title and body are required' }, { status: 400 });
    }

    if (userId && userId !== user.id) {
      const { data: requester } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      if (requester?.role !== 'landlord') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const targetUserId = userId || user.id;

    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('push_enabled')
      .eq('user_id', targetUserId)
      .single();

    if (prefs && !prefs.push_enabled) {
      return NextResponse.json({ error: 'Push notifications disabled' }, { status: 400 });
    }

    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', targetUserId);

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ error: 'No subscriptions found' }, { status: 404 });
    }

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        sendPushNotification(sub.subscription as any, {
          title,
          body,
          data: payloadData || {},
        })
      )
    );

    const sent = results.filter((r) => r.status === 'fulfilled' && r.value.success).length;
    const expired: string[] = [];

    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r.status === 'fulfilled' && r.value.error === 'subscription_expired') {
        const sub = subscriptions[i];
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', (sub.subscription as any).endpoint);
        expired.push((sub.subscription as any).endpoint);
      }
    }

    return NextResponse.json({ success: true, sent, expired: expired.length });
  } catch (err) {
    console.error('[Push Send] Error:', err);
    return NextResponse.json({ error: (err as Error).message || 'Send failed' }, { status: 500 });
  }
}