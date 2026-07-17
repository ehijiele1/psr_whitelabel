-- Fix units_staff_select RLS: restrict to landlord/caretaker roles
-- Previously any authenticated user could SELECT all units of every property

DROP POLICY IF EXISTS units_staff_select ON units;

CREATE POLICY units_staff_select ON units FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles p
                 WHERE p.user_id = auth.uid()
                   AND p.role IN ('landlord', 'caretaker')));
