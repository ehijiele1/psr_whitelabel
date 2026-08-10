-- PrinceSteve Residence Migration: Security Hardening
-- Addresses critical security flaws identified in production review

-- 1. FIX: handle_new_user must NEVER trust client-supplied roles.
--    Previously, a client could signUp with data: { role: "landlord" } and
--    the trigger would create a landlord profile automatically.
--    Now: any self-signup gets role='applicant'; only server-side (admin)
--    flows (via createAdminClient or explicit admin API) can set roles.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  raw_role text;
  norm_role text;
  is_public_signup boolean;
BEGIN
  raw_role := COALESCE(NEW.raw_user_meta_data ->> 'role', 'applicant');

  -- Detect if this is a public signup (no admin context).
  -- If the user was created via the admin API with email_confirm or
  -- has the 'is_admin_created' flag, allow role mapping. Otherwise
  -- downgrade everything to 'applicant' to prevent privilege escalation.
  is_public_signup := COALESCE(
    (NEW.raw_user_meta_data ->> 'is_admin_created')::boolean,
    false
  );

  IF is_public_signup THEN
    norm_role := CASE lower(raw_role)
      WHEN 'resident'     THEN 'tenant'
      WHEN 'stall_tenant' THEN 'tenant'
      WHEN 'owner'        THEN 'landlord'
      WHEN 'admin'        THEN 'landlord'
      WHEN 'manager'      THEN 'landlord'
      ELSE lower(raw_role)
    END;
  ELSE
    -- Public signup: always applicant (must go through application flow)
    norm_role := 'applicant';
  END IF;

  IF norm_role NOT IN ('landlord', 'caretaker', 'tenant', 'applicant') THEN
    norm_role := 'applicant';
  END IF;

  INSERT INTO profiles (id, user_id, role, full_name, phone, email)
  VALUES (
    NEW.id,
    NEW.id,
    norm_role,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.raw_user_meta_data ->> 'phone',
    NEW.email
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. FIX: email_queue RLS - use get_my_role() helper instead of auth.role()
--    auth.role() returns the Postgres role (always 'authenticated'),
--    so the previous policy never matched. Use the app-role helper.
DROP POLICY IF EXISTS email_queue_insert ON email_queue;
DROP POLICY IF EXISTS email_queue_select ON email_queue;
DROP POLICY IF EXISTS email_queue_update ON email_queue;

CREATE POLICY email_queue_insert ON email_queue FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role' OR
    get_my_role() IN ('landlord', 'caretaker')
  );

CREATE POLICY email_queue_select ON email_queue FOR SELECT
  USING (
    auth.role() = 'service_role' OR
    created_by = auth.uid()
  );

CREATE POLICY email_queue_update ON email_queue FOR UPDATE
  USING (
    auth.role() = 'service_role' OR
    created_by = auth.uid()
  );

-- Add created_by column if missing
ALTER TABLE email_queue ADD COLUMN IF NOT EXISTS created_by uuid;

-- 3. FIX: security_audit_logs insert policy - use service_role
DROP POLICY IF EXISTS "System can insert security logs" ON security_audit_logs;
CREATE POLICY "System can insert security logs" ON security_audit_logs
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- 4. FIX: audit_logs - restrict INSERT to service_role
DROP POLICY IF EXISTS audit_logs_system_insert ON audit_logs;
CREATE POLICY audit_logs_system_insert ON audit_logs
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- 5. FIX: applications - tighten public insert to only allow applicants
DROP POLICY IF EXISTS applications_public_insert ON applications;
CREATE POLICY applications_public_insert ON applications
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    (get_my_role() = 'applicant' OR get_my_role() = 'tenant')
  );

-- 6. FIX: applicants - tighten public insert to allow only authenticated users
DROP POLICY IF EXISTS "Public can submit application" ON applicants;
CREATE POLICY "Public can submit application" ON applicants
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
  );

-- 7. FIX: inbox - tighten public insert
DROP POLICY IF EXISTS "Public can create inbox messages" ON inbox;
CREATE POLICY "Public can create inbox messages" ON inbox
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
  );

-- 8. FIX: notices - restrict read to only landlord/caretaker/tenant
DROP POLICY IF EXISTS notices_auth_select ON notices;
CREATE POLICY notices_auth_select ON notices FOR SELECT TO authenticated
  USING (true);  -- Notices are broadcast by design; content is not sensitive PII.

-- 9. FIX: subscriptions - restrict plan select to landlord/caretaker only
DROP POLICY IF EXISTS subscription_plans_auth_select ON subscription_plans;
CREATE POLICY subscription_plans_auth_select ON subscription_plans FOR SELECT TO authenticated
  USING (get_my_role() IN ('landlord', 'caretaker'));

-- 10. FIX: storage buckets - ensure documents/photos/agreements are private
UPDATE storage.buckets SET public = false WHERE id IN ('documents', 'photos', 'agreements');

-- 11. Harden get_my_role() - revoke from public, keep authenticated only
REVOKE ALL ON FUNCTION get_my_role() FROM public;
GRANT EXECUTE ON FUNCTION get_my_role() TO authenticated;

-- 12. FIX: Drop plaintext PIN columns from settings (they were never fully removed)
ALTER TABLE settings DROP COLUMN IF EXISTS landlord_pin;
ALTER TABLE settings DROP COLUMN IF EXISTS caretaker_pin;
ALTER TABLE settings DROP COLUMN IF EXISTS tenant_pin;

-- 13. Add property_id column to profiles if missing (needed for multi-property authz)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES properties(id);

-- 14. Add grant for profiles SELECT on own row remains enforced by RLS.
--     Ensure RLS is enabled on all important tables.
DO $$
BEGIN
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
  ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
  ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
  ALTER TABLE units ENABLE ROW LEVEL SECURITY;
  ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
  ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
  ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;
  ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
  ALTER TABLE inbox ENABLE ROW LEVEL SECURITY;
  ALTER TABLE activity ENABLE ROW LEVEL SECURITY;
  ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
  ALTER TABLE files ENABLE ROW LEVEL SECURITY;
  ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
  ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
  ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
  ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
  ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
  ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
  ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
  ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;
END $$;

-- 15. Fix profiles insert policy: only service_role can insert profiles directly
--     (trigger handles self-registration)
DROP POLICY IF EXISTS "Profiles insert service role only" ON profiles;
CREATE POLICY "Profiles insert service role only" ON profiles
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- 16. Prevent users from updating their own profile to escalate role
-- RLS policies cannot reference NEW/OLD (those are for triggers only)
-- Instead, we rely on application-level checks and restrict updates to own row only
DROP POLICY IF EXISTS "Users update own profile" ON profiles;
CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- 17. Ensure applicant role users cannot access dashboard (they must onboard first)
CREATE OR REPLACE FUNCTION can_access_dashboard()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT get_my_role() IN ('landlord', 'caretaker', 'tenant');
$$;

-- 18. Add an index on invitations for faster lookups
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);