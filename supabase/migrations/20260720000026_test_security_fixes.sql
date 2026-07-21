-- Test script to verify security fixes
-- Run this in Supabase SQL Editor to verify the fixes

-- Test 1: Check if landlord_financial_summary view exists and works
SELECT COUNT(*) as view_records FROM landlord_financial_summary WHERE EXISTS (SELECT 1 FROM properties WHERE id = property_id AND landlord_id = auth.uid());

-- Test 2: Check if function permissions are restricted
-- This should fail for authenticated users (expected behavior)
-- SELECT get_my_role();

-- Test 3: Check if RLS policies are working properly
-- Test landlord access to properties
SELECT COUNT(*) as landlord_properties FROM properties WHERE landlord_id = auth.uid();

-- Test 4: Check if utility functions work correctly
-- Generate a test receipt number
SELECT generate_receipt_number('rent', 2026) as test_receipt;

-- Test 5: Check if security audit log table was created
SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'security_audit_logs') as audit_table_exists;

-- Test 6: Check if extensions schema exists
SELECT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'extensions') as extensions_schema_exists;