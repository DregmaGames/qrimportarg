/*
  # Fix product access policies

  1. Changes
    - Drop existing policies
    - Create new policy for public product access
    - Add specific policy for authenticated users
    - Enable RLS
    
  2. Security
    - Allow public read access to specific products
    - Maintain authenticated user access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public product viewing" ON public.productos;
DROP POLICY IF EXISTS "Users can read own products" ON public.productos;

-- Create new policies
CREATE POLICY "public_product_access"
ON public.productos
FOR SELECT
TO public
USING (true);

CREATE POLICY "authenticated_user_access"
ON public.productos
FOR ALL
TO authenticated
USING (
  CASE 
    WHEN current_user IS NOT NULL THEN
      created_by = auth.uid()
    ELSE 
      true
  END
)
WITH CHECK (created_by = auth.uid());

-- Ensure RLS is enabled
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;