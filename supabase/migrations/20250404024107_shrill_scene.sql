/*
  # Update RLS policies for productos and storage

  1. Changes
    - Update RLS policy for productos table to allow all operations
    - Add storage bucket policy for certificates

  2. Security
    - Enable public access for productos table operations
    - Enable public access for certificate uploads
*/

-- Update productos table policy
DROP POLICY IF EXISTS "Public access policy" ON productos;

CREATE POLICY "Enable all access for productos"
ON productos
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Create storage bucket policies
BEGIN;
  -- Enable storage access
  CREATE POLICY "Give public access to certificates"
  ON storage.objects FOR ALL TO public
  USING (bucket_id = 'certificates')
  WITH CHECK (bucket_id = 'certificates');
COMMIT;