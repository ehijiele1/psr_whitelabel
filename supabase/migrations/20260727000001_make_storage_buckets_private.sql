-- Ensure all storage buckets are private (not publicly accessible)
-- This prevents unauthorized access to files via direct URLs

-- Update documents bucket
UPDATE storage.buckets SET public = false WHERE id = 'documents';

-- Update photos bucket
UPDATE storage.buckets SET public = false WHERE id = 'photos';

-- Update agreements bucket
UPDATE storage.buckets SET public = false WHERE id = 'agreements';

-- Create RLS policies for signed URL access (if needed)
-- Note: With buckets set to private, all access must go through the API
-- with proper ownership checks
