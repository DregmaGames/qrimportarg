/*
  # Update storage policies for public access

  1. Changes
    - Set djc_documents bucket to public
    - Remove all authentication requirements from storage policies
    - Allow public access for uploading, reading, and updating files
    
  2. Security Note
    - This is a temporary configuration for development
    - Authentication will be added in a future update
*/

-- Update bucket to be public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'djc_documents';

-- Remove any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to upload DJC documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read DJC documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update DJC documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public users to upload DJC documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public users to read DJC documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public users to update DJC documents" ON storage.objects;

-- Create policy to allow public users to upload DJC documents
CREATE POLICY "Allow public users to upload DJC documents"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'djc_documents');

-- Create policy to allow public users to read DJC documents
CREATE POLICY "Allow public users to read DJC documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'djc_documents');

-- Create policy to allow public users to update DJC documents
CREATE POLICY "Allow public users to update DJC documents"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'djc_documents')
WITH CHECK (bucket_id = 'djc_documents');

-- Ensure RLS is enabled for storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;