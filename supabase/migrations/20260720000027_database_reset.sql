-- PrinceSteve Residence Database Reset Script
-- WARNING: This will delete ALL data and reset the database to a fresh state
-- Run this script in Supabase SQL Editor to completely reset the database

-- Step 1: Delete all user data from auth.users (this will delete all users)
-- Note: This cannot be undone - make sure you want to delete all users
DELETE FROM auth.users;

-- Step 2: Delete all profile data
DELETE FROM profiles;

-- Step 3: Delete all property-related data
DELETE FROM properties;
DELETE FROM units;
DELETE FROM tenants;

-- Step 4: Delete all financial data
DELETE FROM payments;
DELETE FROM applicants;
DELETE FROM tickets;

-- Step 5: Delete all messaging and activity data
DELETE FROM inbox;
DELETE FROM activity;
DELETE FROM messages;

-- Step 6: Delete all settings and configuration
DELETE FROM settings;

-- Step 7: Delete security audit logs and other system data
DELETE FROM security_audit_logs;
DELETE FROM email_queue;
DELETE FROM push_subscriptions;

-- Step 8: Reset sequences to start from 1
ALTER SEQUENCE receipt_rent_seq RESTART WITH 1;
ALTER SEQUENCE receipt_levy_seq RESTART WITH 1;

-- Step 9: Clean up any remaining data
-- Drop views that might reference deleted data
DROP VIEW IF EXISTS landlord_financial_summary;

-- Step 10: Reset the single settings row (if needed)
INSERT INTO settings (id, property_name, landlord_name, address, emergency_phone, caretaker_name, caretaker_phone, bank_name, account_number, account_name, email, landlord_pin, caretaker_pin, tenant_pin, signature_url, whatsapp_number, updated_at)
VALUES (gen_random_uuid(), 'PrinceSteve Residence', 'Mrs. Ibadin R.E', '35 Godilove Street, Akowonjo Egbeda, Lagos', '+2348054164910', 'Steve', '+2348024427735', 'First Bank Nigeria', '3012345678', 'Prince Steve Residence', 'beckydin63@gmail.com', '1234', '5678', '0000', NULL, NULL, now())
ON CONFLICT (id) DO NOTHING;

-- Step 11: Verify cleanup (run these queries to confirm cleanup)
-- These should return 0 rows after cleanup
SELECT COUNT(*) as remaining_users FROM auth.users;
SELECT COUNT(*) as remaining_profiles FROM profiles;
SELECT COUNT(*) as remaining_properties FROM properties;
SELECT COUNT(*) as remaining_tenants FROM tenants;
SELECT COUNT(*) as remaining_payments FROM payments;
SELECT COUNT(*) as remaining_applicants FROM applicants;
SELECT COUNT(*) as remaining_tickets FROM tickets;

-- Final confirmation message
-- If all queries return 0, the database has been successfully reset
SELECT 'Database reset completed successfully' as status;