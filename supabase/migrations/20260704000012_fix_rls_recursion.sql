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
