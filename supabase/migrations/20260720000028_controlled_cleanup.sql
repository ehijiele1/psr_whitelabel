-- PrinceSteve Residence Database Cleanup Script (Alternative)
-- This script provides a more controlled cleanup approach

-- WARNING: This script will delete most data but preserve some system configurations
-- Use this if you want to keep some setup data but reset user data

-- Step 1: Delete all user data (keep system users if any)
-- Note: This deletes all auth users - cannot be undone
DELETE FROM auth.users WHERE email NOT LIKE '%@supabase.co' AND email NOT LIKE '%@vercel.com';

-- Step 2: Delete all profile data
DELETE FROM profiles;

-- Step 3: Delete tenant-related data (keep properties and units)
DELETE FROM tenants;
DELETE FROM payments;
DELETE FROM applicants;
DELETE FROM tickets;

-- Step 4: Delete messaging and activity data
DELETE FROM inbox;
DELETE FROM activity;
DELETE FROM messages;

-- Step 5: Delete email queue and push subscriptions
DELETE FROM email_queue;
DELETE FROM push_subscriptions;

-- Step 6: Reset sequences
ALTER SEQUENCE receipt_rent_seq RESTART WITH 1;
ALTER SEQUENCE receipt_levy_seq RESTART WITH 1;

-- Step 7: Drop views that reference deleted data
DROP VIEW IF EXISTS landlord_financial_summary;

-- Step 8: Keep settings but reset some values
UPDATE settings SET 
    landlord_name = 'Mrs. Ibadin R.E',
    emergency_phone = '+2348054164910',
    caretaker_name = 'Steve',
    caretaker_phone = '+2348024427735',
    bank_name = 'First Bank Nigeria',
    account_number = '3012345678',
    account_name = 'Prince Steve Residence',
    email = 'beckydin63@gmail.com',
    updated_at = now()
WHERE id IS NOT NULL;

-- Step 9: Verify cleanup
SELECT COUNT(*) as remaining_users FROM auth.users;
SELECT COUNT(*) as remaining_profiles FROM profiles;
SELECT COUNT(*) as remaining_properties FROM properties;
SELECT COUNT(*) as remaining_tenants FROM tenants;
SELECT COUNT(*) as remaining_payments FROM payments;
SELECT COUNT(*) as remaining_applicants FROM applicants;
SELECT COUNT(*) as remaining_tickets FROM tickets;

-- Step 10: Check if properties and units exist (should be preserved)
SELECT COUNT(*) as properties_count FROM properties;
SELECT COUNT(*) as units_count FROM units;

SELECT 'Controlled cleanup completed' as status;