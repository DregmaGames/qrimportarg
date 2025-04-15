/*
  # Fix recursive policies in productos table

  1. Changes
    - Remove redundant and recursive policies
    - Simplify access control logic
    - Create clear, non-recursive policies for:
      - Public read access for all products
      - Authenticated users can manage their own products
  
  2. Security
    - Maintains RLS on productos table
    - Replaces existing policies with non-recursive versions
    - Ensures proper access control without infinite loops
*/

-- Drop existing policies that are causing recursion
DROP POLICY IF EXISTS "Allow public product viewing" ON productos;
DROP POLICY IF EXISTS "Users can delete own products" ON productos;
DROP POLICY IF EXISTS "Users can insert own products" ON productos;
DROP POLICY IF EXISTS "Users can update own products" ON productos;
DROP POLICY IF EXISTS "authenticated_user_access" ON productos;
DROP POLICY IF EXISTS "public_product_access" ON productos;

-- Create new, simplified policies
CREATE POLICY "enable_public_read" ON productos
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "enable_auth_insert" ON productos
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "enable_auth_update" ON productos
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "enable_auth_delete" ON productos
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);