-- Wipe all user data in FK-safe order (run as service_role)

-- 1. Drop all dependent tables first
DELETE FROM unit_charges;
DELETE FROM lease_agreements;
DELETE FROM id_verifications;
DELETE FROM applications;
DELETE FROM payments;
DELETE FROM tickets;
DELETE FROM tenants;
DELETE FROM units;
DELETE FROM properties;

-- 2. Now profiles (no FKs pointing to it)
DELETE FROM profiles;

-- 3. Finally auth.users (requires service_role)
DELETE FROM auth.users;