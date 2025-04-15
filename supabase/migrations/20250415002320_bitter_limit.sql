/*
  # Update RLS policies for public product access

  1. Changes
    - Add policy for public read access to productos table
    - Maintain existing policies for authenticated users
    
  2. Security
    - Allow public access only for reading product information
    - Maintain authenticated user restrictions for modifications
*/

-- Add policy for public read access to productos
CREATE POLICY "Allow public read access to products"
ON public.productos
FOR SELECT
TO public
USING (true);

-- Ensure RLS is enabled
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;