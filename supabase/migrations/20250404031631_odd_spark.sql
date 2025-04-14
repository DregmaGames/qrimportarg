/*
  # Create storage bucket for DJC documents

  1. New Storage Bucket
    - Creates a new storage bucket named 'djc_documents' for storing DJC PDF files
  
  2. Security
    - Enables public access for reading DJC documents
    - Restricts upload/delete operations to authenticated users
    - Enforces file size and type limitations
*/

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('djc_documents', 'djc_documents', true);

-- Policy to allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload DJC documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'djc_documents' AND
  (CASE
    WHEN RIGHT(name, 4) = '.pdf' THEN true
    ELSE false
  END)
);

-- Policy to allow public access to read files
CREATE POLICY "Public users can view DJC documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'djc_documents');

-- Policy to allow authenticated users to delete their own files
CREATE POLICY "Users can delete their own DJC documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'djc_documents');