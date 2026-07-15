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
