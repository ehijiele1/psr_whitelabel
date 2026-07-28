import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/clientFactory';
import { sendPushNotification } from '@/lib/push'
import { pushSendSchema, validateSchema } from '@/lib/schemas'
import { csrfProtection } from '@/lib/csrf'

import type { PushSubscription } from 'web-push';

interface SubscriptionRow {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/**
 * Reconstruct a PushSubscription object from database columns
 */
function reconstructPushSubscription(row: SubscriptionRow): PushSubscription {
  return {
    endpoint: row.endpoint,
    keys: {
      p256dh: row.p256dh,
      auth: row.auth,
    },
  };
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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bodyData = await req.json();
    
    // Validate using Zod schema
    const validation = validateSchema(pushSendSchema, bodyData);
    if (!validation.success || !validation.data) {
      return NextResponse.json({ error: validation.error || 'Invalid data' }, { status: 400 });
    }

    const { title, body, data: payloadData, userId } = validation.data;

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
      .select('endpoint, p256dh, auth')
      .eq('user_id', targetUserId);

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ error: 'No subscriptions found' }, { status: 404 });
    }

    const results = await Promise.allSettled(
      (subscriptions as SubscriptionRow[]).map((sub) =>
        sendPushNotification(reconstructPushSubscription(sub), {
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
        const sub = (subscriptions as SubscriptionRow[])[i];
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', sub.endpoint);
        expired.push(sub.endpoint);
      }
    }

    return NextResponse.json({ success: true, sent, expired: expired.length });
  } catch (err) {
    console.error('[Push Send] Error:', err);
    return NextResponse.json({ error: (err as Error).message || 'Send failed' }, { status: 500 });
  }
}