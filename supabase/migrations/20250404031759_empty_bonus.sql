/*
  # Fix storage bucket and RLS policies

  1. Storage
    - Create djc_documents bucket if not exists
    - Add policies for authenticated users to upload files
    - Add policies for public access to read files
    
  2. Database
    - Ensure RLS is enabled on productos table
    - Add policies for CRUD operations
*/

-- Create the storage bucket if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE id = 'djc_documents'
    ) THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('djc_documents', 'djc_documents', true);
    END IF;
END $$;

-- Drop existing policies if they exist
DO $$
BEGIN
    DROP POLICY IF EXISTS "Authenticated users can upload DJC documents" ON storage.objects;
    DROP POLICY IF EXISTS "Public users can view DJC documents" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their own DJC documents" ON storage.objects;
EXCEPTION
    WHEN undefined_object THEN
        NULL;
END $$;

-- Create storage policies
CREATE POLICY "Authenticated users can upload DJC documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'djc_documents'
);

CREATE POLICY "Public users can view DJC documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'djc_documents');

CREATE POLICY "Users can delete their own DJC documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'djc_documents');

-- Ensure RLS is enabled on productos table
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$
BEGIN
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON productos;
    DROP POLICY IF EXISTS "Enable read access for all users" ON productos;
    DROP POLICY IF EXISTS "Enable update for authenticated users only" ON productos;
    DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON productos;
EXCEPTION
    WHEN undefined_object THEN
        NULL;
END $$;

-- Create database policies
CREATE POLICY "Enable insert for authenticated users only"
ON productos FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Enable read access for all users"
ON productos FOR SELECT
TO public
USING (true);

CREATE POLICY "Enable update for authenticated users only"
ON productos FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users only"
ON productos FOR DELETE
TO authenticated
USING (true);