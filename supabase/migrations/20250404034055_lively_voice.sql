/*
  # Fix Storage Policies for DJC Documents

  1. Changes
    - Remove folder name check from storage policies
    - Simplify bucket access conditions
    - Ensure proper access for authenticated users

  2. Security
    - Maintain RLS for storage objects
    - Only allow authenticated users to access DJC documents
    - Ensure proper bucket access control
*/

-- Remove any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to upload DJC documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read DJC documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update DJC documents" ON storage.objects;

-- Create policy to allow authenticated users to upload DJC documents
CREATE POLICY "Allow authenticated users to upload DJC documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'djc_documents');

-- Create policy to allow authenticated users to read DJC documents
CREATE POLICY "Allow authenticated users to read DJC documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'djc_documents');

-- Create policy to allow authenticated users to update DJC documents
CREATE POLICY "Allow authenticated users to update DJC documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'djc_documents')
WITH CHECK (bucket_id = 'djc_documents');

-- Ensure RLS is enabled for storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;