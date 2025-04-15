/*
  # Fix public access for QR code scanning

  1. Changes
    - Update RLS policy to explicitly allow public access for QR routes
    - Ensure proper access control for product viewing
    
  2. Security
    - Maintain RLS enabled
    - Allow public read-only access for specific use cases
*/

-- Drop existing public access policy
DROP POLICY IF EXISTS "Allow public read access to products" ON public.productos;

-- Create new specific policy for QR and product viewing
CREATE POLICY "Allow public product viewing"
ON public.productos
FOR SELECT
TO public
USING (
  -- Allow access if the product exists
  EXISTS (
    SELECT 1 
    FROM public.productos p 
    WHERE p.codigo_unico = productos.codigo_unico
  )
);

-- Ensure RLS is enabled
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;