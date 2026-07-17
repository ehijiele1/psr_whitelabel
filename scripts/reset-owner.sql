-- Reset owner & all data so setup wizard runs fresh on next login
-- Run this in Supabase SQL Editor (service_role context)

-- 1. Delete all app data in FK-safe order
DELETE FROM unit_charges;
DELETE FROM tenant_subscriptions;
DELETE FROM subscription_plans;
DELETE FROM lease_agreements;
DELETE FROM id_verifications;
DELETE FROM applications;
DELETE FROM applicants;
DELETE FROM agreements;
DELETE FROM activity;
DELETE FROM inbox;
DELETE FROM messages;
DELETE FROM email_queue;
DELETE FROM audit_logs;
DELETE FROM invitations;
DELETE FROM notices;
DELETE FROM notification_preferences;
DELETE FROM push_subscriptions;
DELETE FROM files;
DELETE FROM payments;
DELETE FROM tickets;
DELETE FROM tenants;
DELETE FROM units;
DELETE FROM properties;

-- 2. Delete all profiles (except the trigger will re-create for remaining auth users)
DELETE FROM profiles;

-- 3. Delete the owner from auth.users
-- Replace 'owner-email@example.com' with the actual owner email
DELETE FROM auth.users WHERE email = 'owner-email@example.com';
