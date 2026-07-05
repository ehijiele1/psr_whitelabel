-- PrinceSteve Residence Migration 07: Subscriptions
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, description text,
  amount numeric(15,2) NOT NULL,
  interval text NOT NULL DEFAULT 'monthly' CONSTRAINT check_plan_interval CHECK (interval IN ('monthly','quarterly','biannually','annually')),
  paystack_plan_code text,
  status text NOT NULL DEFAULT 'active' CONSTRAINT check_plan_status CHECK (status IN ('active','inactive')),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS subscription_plans_landlord_all ON subscription_plans;
CREATE POLICY subscription_plans_landlord_all ON subscription_plans FOR ALL USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'landlord'));
DROP POLICY IF EXISTS subscription_plans_auth_select ON subscription_plans;
CREATE POLICY subscription_plans_auth_select ON subscription_plans FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS tenant_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) NOT NULL,
  plan_id uuid REFERENCES subscription_plans(id) NOT NULL,
  property_id uuid REFERENCES properties(id),
  paystack_subscription_code text, paystack_email_token text,
  status text NOT NULL DEFAULT 'active' CONSTRAINT check_subscription_status CHECK (status IN ('active','cancelled','paused','expired')),
  current_period_start timestamptz, current_period_end timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_subscriptions_self_select ON tenant_subscriptions;
CREATE POLICY tenant_subscriptions_self_select ON tenant_subscriptions FOR SELECT USING (tenant_id IN (SELECT id FROM tenants WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS tenant_subscriptions_landlord_all ON tenant_subscriptions;
CREATE POLICY tenant_subscriptions_landlord_all ON tenant_subscriptions FOR ALL USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'landlord'));
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant ON tenant_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_plan ON tenant_subscriptions(plan_id);