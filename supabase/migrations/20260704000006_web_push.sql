-- PrinceSteve Residence Migration 06: Web Push
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  endpoint text NOT NULL, p256dh text NOT NULL, auth text NOT NULL,
  user_agent text, created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS push_subscriptions_self_all ON push_subscriptions;
CREATE POLICY push_subscriptions_self_all ON push_subscriptions FOR ALL USING (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);