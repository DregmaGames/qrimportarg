/*
  # Add product ownership and access control

  1. Changes to productos table
    - Add created_by foreign key to auth.users
    - Add updated_at timestamp
    - Add indexes for performance
    - Update RLS policies for ownership-based access

  2. Security
    - Enable RLS
    - Add policies for ownership-based access control
    - Add audit fields
*/

-- Add ownership and audit fields to productos
ALTER TABLE productos
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_productos_updated_at
    BEFORE UPDATE ON productos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS productos_created_by_idx ON productos(created_by);
CREATE INDEX IF NOT EXISTS productos_created_at_idx ON productos(created_at);

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON productos;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON productos;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON productos;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON productos;

-- Create new RLS policies
CREATE POLICY "Users can read own products"
ON productos FOR SELECT
TO authenticated
USING (created_by = auth.uid());

CREATE POLICY "Users can insert own products"
ON productos FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own products"
ON productos FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete own products"
ON productos FOR DELETE
TO authenticated
USING (created_by = auth.uid());

-- Create function to check product ownership
CREATE OR REPLACE FUNCTION check_product_ownership(product_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM productos
    WHERE codigo_unico = product_id
    AND created_by = auth.uid()
  );
$$;