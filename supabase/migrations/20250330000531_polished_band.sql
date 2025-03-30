/*
  # Create storage bucket for product files

  1. New Storage Bucket
    - Creates a bucket named 'product-files' for storing product certificates
    - Sets appropriate security policies
  
  2. Security
    - Enable RLS on the bucket
    - Add policy for authenticated users to read/write their own files
*/

-- Create the storage bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('product-files', 'product-files', false)
on conflict (id) do nothing;

-- Set up security policies
create policy "Users can upload their own product files"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'product-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update their own product files"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'product-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can read their own product files"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'product-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own product files"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'product-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow public access to product files (for public product pages)
create policy "Public can read product files"
  on storage.objects
  for select
  to public
  using (bucket_id = 'product-files');