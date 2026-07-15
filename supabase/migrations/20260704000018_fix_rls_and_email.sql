-- PrinceSteve Residence Migration 18: Fix units/properties RLS recursion + profiles.email
-- ---------------------------------------------------------------------------
-- 1. Break the units <-> properties recursion.
--    properties_tenant_select previously JOINed `units`, while the units_*
--    policies subquery `properties` -> infinite loop (Postgres 42P17).
--    Rewrite it to use the tenants.property_id FK directly. tenants RLS only
--    touches `profiles` via the SECURITY DEFINER get_my_role(), which cannot
--    recurse, so the cycle is broken.
DROP POLICY IF EXISTS properties_tenant_select ON properties;
CREATE POLICY properties_tenant_select ON properties FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM tenants t
    WHERE t.user_id = auth.uid() AND t.property_id = properties.id
  ));

-- 2. Add email to profiles (header name + Staff Management page query it).
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text;

UPDATE profiles
   SET email = (SELECT au.email FROM auth.users au WHERE au.id = profiles.user_id)
 WHERE email IS NULL;

-- 3. Auto-provision email on signup so new profiles are never email-less.
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
    WHEN 'resident'    THEN 'tenant'
    WHEN 'stall_tenant' THEN 'tenant'
    WHEN 'owner'       THEN 'landlord'
    WHEN 'admin'       THEN 'landlord'
    WHEN 'manager'     THEN 'landlord'
    ELSE lower(raw_role)
  END;

  IF norm_role NOT IN ('landlord', 'caretaker', 'tenant', 'applicant') THEN
    norm_role := 'tenant';
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 4. Allow notice recipients to mark a notice read (append self to read_by).
DROP POLICY IF EXISTS notices_self_update ON notices;
CREATE POLICY notices_self_update ON notices FOR UPDATE
  USING (recipient_id = 'ALL' OR recipient_id = auth.uid()::text)
  WITH CHECK (recipient_id = 'ALL' OR recipient_id = auth.uid()::text);
