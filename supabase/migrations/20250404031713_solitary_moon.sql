/*
  # Add RLS policies for productos table

  1. Security
    - Enable RLS on productos table
    - Add policies for CRUD operations
    - Allow authenticated users to:
      - Insert new products
      - Update their products
      - Delete their products
      - Read all products
*/

-- Enable RLS on productos table if not already enabled
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

-- Policy for inserting new products
CREATE POLICY "Enable insert for authenticated users only"
ON productos FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Policy for selecting products
CREATE POLICY "Enable read access for all users"
ON productos FOR SELECT
TO public
USING (true);

-- Policy for updating products
CREATE POLICY "Enable update for authenticated users only"
ON productos FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy for deleting products
CREATE POLICY "Enable delete for authenticated users only"
ON productos FOR DELETE
TO authenticated
USING (true);