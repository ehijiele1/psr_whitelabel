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
