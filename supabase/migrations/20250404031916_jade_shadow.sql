/*
  # Fix RLS policies and storage setup for DJC documents

  1. Storage Setup
    - Create storage bucket for DJC documents if it doesn't exist
    
  2. Security Changes
    - Update RLS policies for productos table to explicitly allow DJC updates
    
  3. Changes
    - Enable authenticated users to update DJC-related fields in productos
*/

-- Create storage bucket for DJC documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('djc_documents', 'djc_documents', false)
ON CONFLICT (id) DO NOTHING;

-- Update RLS policies for productos table
DO $$ 
BEGIN
  -- Drop existing update policy if it exists
  DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.productos;
  
  -- Create new update policy that explicitly allows DJC updates
  CREATE POLICY "Enable update for authenticated users only" 
    ON public.productos
    FOR UPDATE 
    TO authenticated 
    USING (true)
    WITH CHECK (true);

  -- Ensure RLS is enabled
  ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
END $$;