-- ============================================================================
-- PrinceSteve Residence � Consolidated migration bundle (run ONCE in Supabase SQL Editor)
-- Project ref: topvvizfllbuuhgliujk
-- Idempotent: safe to re-run. Mirrors migrations 12-16 in supabase/migrations/.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- >>> supabase/migrations/20260704000012_fix_rls_recursion.sql
-- ----------------------------------------------------------------------------

-- PrinceSteve Residence Migration 12: Fix RLS infinite recursion on profiles
-- The base_schema policy "Landlord reads all profiles" queried the profiles
-- table from within a policy defined ON profiles, causing Postgres error 42P17
-- (infinite recursion). This cascaded to every policy that used
-- EXISTS (SELECT 1 FROM profiles ...). We replace the self-referential lookup
-- with a SECURITY DEFINER helper that bypasses RLS.

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

REVOKE ALL ON FUNCTION get_my_role() FROM public;
GRANT EXECUTE ON FUNCTION get_my_role() TO authenticated;

-- Rewrite the recursive profiles policy to use the helper (no recursion).
DROP POLICY IF EXISTS "Landlord reads all profiles" ON profiles;
CREATE POLICY "Landlord reads all profiles" ON profiles
  FOR SELECT USING (get_my_role() = 'landlord');


-- ----------------------------------------------------------------------------
-- >>> supabase/migrations/20260704000013_handle_new_user.sql
-- ----------------------------------------------------------------------------

-- PrinceSteve Residence Migration 13: Auto-provision profiles on signup
-- Previously no profiles row was created when a user signed up via
-- supabase.auth.signUp (register / onboarding / invite / add-tenant / add-staff),
-- breaking role-based routing and name display. This trigger creates the row
-- automatically and normalizes any legacy role values to the allowed set.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  raw_role text;
  norm_role text;
BEGIN
  raw_role := COALESCE(NEW.raw_user_meta_data ->> 'role', 'tenant');

  norm_role := CASE lower(raw_role)
    WHEN 'resident' THEN 'tenant'
    WHEN 'stall_tenant' THEN 'tenant'
    WHEN 'owner' THEN 'landlord'
    WHEN 'admin' THEN 'landlord'
    WHEN 'manager' THEN 'landlord'
    ELSE lower(raw_role)
  END;

  IF norm_role NOT IN ('landlord', 'caretaker', 'tenant', 'applicant') THEN
    norm_role := 'tenant';
  END IF;

  INSERT INTO profiles (id, user_id, role, full_name, phone)
  VALUES (
    NEW.id,
    NEW.id,
    norm_role,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.raw_user_meta_data ->> 'phone'
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ----------------------------------------------------------------------------
-- >>> supabase/migrations/20260704000014_fix_profile_fks.sql
-- ----------------------------------------------------------------------------

-- PrinceSteve Residence Migration 14: Foreign keys to profiles for PostgREST embeds
-- queries.ts embeds profiles(...) from tenants and applications, but those tables
-- only had FKs to auth.users, so PostgREST could not resolve the relationship.
-- Add explicit FKs to profiles(user_id) (which is UNIQUE) to enable embedding.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenants_user_id_profiles_fkey'
  ) THEN
    ALTER TABLE tenants
      ADD CONSTRAINT tenants_user_id_profiles_fkey
      FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'applications_user_id_profiles_fkey'
  ) THEN
    ALTER TABLE applications
      ADD CONSTRAINT applications_user_id_profiles_fkey
      FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
  END IF;
END $$;


-- ----------------------------------------------------------------------------
-- >>> supabase/migrations/20260704000015_messages.sql
-- ----------------------------------------------------------------------------

-- PrinceSteve Residence Migration 15: Direct messages
-- The messaging UI (dashboard/messages) reads/writes a `messages` table that
-- did not exist. Create it with RLS so a user can only read messages they are
-- part of and can only send as themselves.

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL CHECK (char_length(message) > 0 AND char_length(message) <= 5000),
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS messages_participant_select ON messages;
CREATE POLICY messages_participant_select ON messages
  FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());

DROP POLICY IF EXISTS messages_sender_insert ON messages;
CREATE POLICY messages_sender_insert ON messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

DROP POLICY IF EXISTS messages_receiver_update ON messages;
CREATE POLICY messages_receiver_update ON messages
  FOR UPDATE USING (receiver_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);


-- ----------------------------------------------------------------------------
-- >>> supabase/migrations/20260704000016_remove_default_pins.sql
-- ----------------------------------------------------------------------------

-- PrinceSteve Residence Migration 16: Remove hardcoded default PINs
-- base_schema seeded guessable PINs (1234/5678/0000) on every deployment.
-- Drop the insecure defaults and clear any values that still match them.

ALTER TABLE settings ALTER COLUMN landlord_pin DROP DEFAULT;
ALTER TABLE settings ALTER COLUMN caretaker_pin DROP DEFAULT;
ALTER TABLE settings ALTER COLUMN tenant_pin DROP DEFAULT;

UPDATE settings SET landlord_pin = NULL WHERE landlord_pin = '1234';
UPDATE settings SET caretaker_pin = NULL WHERE caretaker_pin = '5678';
UPDATE settings SET tenant_pin = NULL WHERE tenant_pin = '0000';

