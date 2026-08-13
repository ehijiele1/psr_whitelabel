-- Fix: handle_new_user must pin search_path to public.
-- GoTrue runs auth inserts as supabase_auth_admin whose search_path does not
-- include public, so the trigger's unqualified `profiles` reference failed
-- with "relation profiles does not exist" -> "Database error creating new user".
-- The hardened function also enforces role mapping only for admin-created users
-- and inserts email into profiles.

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

-- Recreate the trigger (idempotent).
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
