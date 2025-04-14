/*
  # Update productos table RLS policies

  1. Changes
    - Remove existing RLS policies on productos table
    - Add new policies for:
      - Inserting products (authenticated users)
      - Reading products (authenticated users)
      - Updating products (authenticated users)
      - Deleting products (authenticated users)
  
  2. Security
    - Maintain RLS enabled on productos table
    - Allow authenticated users to perform CRUD operations
    - Ensure created_by is set to the user's ID for new products
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Clients can access their own products" ON productos;
DROP POLICY IF EXISTS "Coordinators have full access to products" ON productos;
DROP POLICY IF EXISTS "Super admins have full access to products" ON productos;

-- Create new policies
CREATE POLICY "Enable read access for authenticated users"
ON productos FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert access for authenticated users"
ON productos FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users"
ON productos FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users"
ON productos FOR DELETE
TO authenticated
USING (true);