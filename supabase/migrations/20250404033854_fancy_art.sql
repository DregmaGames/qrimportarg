/*
  # Add storage policies for DJC documents

  1. Storage Policies
    - Enable authenticated users to upload DJC documents
    - Enable authenticated users to read DJC documents
    - Enable authenticated users to update DJC documents
*/

-- Create storage bucket if it doesn't exist
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('djc_documents', 'djc_documents', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Remove any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to upload DJC documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read DJC documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update DJC documents" ON storage.objects;

-- Create policy to allow authenticated users to upload DJC documents
CREATE POLICY "Allow authenticated users to upload DJC documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'djc_documents'
  AND (storage.foldername(name))[1] = 'djc_documents'
);

-- Create policy to allow authenticated users to read DJC documents
CREATE POLICY "Allow authenticated users to read DJC documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'djc_documents'
  AND (storage.foldername(name))[1] = 'djc_documents'
);

-- Create policy to allow authenticated users to update DJC documents
CREATE POLICY "Allow authenticated users to update DJC documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'djc_documents'
  AND (storage.foldername(name))[1] = 'djc_documents'
)
WITH CHECK (
  bucket_id = 'djc_documents'
  AND (storage.foldername(name))[1] = 'djc_documents'
);