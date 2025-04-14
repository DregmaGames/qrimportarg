/*
  # Update Storage Policies for DJC Documents

  1. Changes
    - Drop existing storage policies to avoid conflicts
    - Create new simplified policies for authenticated users
    - Enable public access to the bucket
    - Ensure RLS is enabled
    
  2. Security
    - Allow authenticated users to upload files to djc_documents bucket
    - Allow authenticated users to read files from djc_documents bucket
    - Allow authenticated users to update files in djc_documents bucket
*/

-- Update bucket to be public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'djc_documents';

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
TO public
USING (bucket_id = 'djc_documents');

-- Create policy to allow authenticated users to update DJC documents
CREATE POLICY "Allow authenticated users to update DJC documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'djc_documents')
WITH CHECK (bucket_id = 'djc_documents');

-- Ensure RLS is enabled for storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;