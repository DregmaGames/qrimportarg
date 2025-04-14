/*
  # Add deletion system tables and functions

  1. New Tables
    - `deleted_products`: Stores deleted product information
      - All columns from productos table
      - deletion_timestamp
      - deleted_by
      - restore_deadline
    - `deletion_logs`: Tracks deletion and restoration actions
      - id
      - action_type
      - product_id
      - performed_by
      - timestamp
      - details

  2. Security
    - Enable RLS on new tables
    - Add policies for authenticated users
*/

-- Create deleted_products table
CREATE TABLE IF NOT EXISTS deleted_products (
  codigo_unico uuid PRIMARY KEY,
  nombre_producto text NOT NULL,
  fabricante text NOT NULL,
  domicilio_fabricante text NOT NULL,
  identificacion text NOT NULL,
  marca text NOT NULL DEFAULT '',
  modelo text NOT NULL DEFAULT '',
  dimensiones text NOT NULL DEFAULT '',
  peso text NOT NULL DEFAULT '',
  materiales text NOT NULL DEFAULT '',
  caracteristicas_tecnicas text NOT NULL DEFAULT '',
  capacidades_limitaciones text NOT NULL DEFAULT '',
  certificado_url text,
  qr_code_url text,
  qr_version integer DEFAULT 1,
  qr_generated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  deletion_timestamp timestamptz DEFAULT now(),
  deleted_by uuid REFERENCES auth.users(id),
  restore_deadline timestamptz NOT NULL
);

-- Create deletion_logs table
CREATE TABLE IF NOT EXISTS deletion_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type text NOT NULL,
  product_id uuid NOT NULL,
  performed_by uuid REFERENCES auth.users(id),
  timestamp timestamptz DEFAULT now(),
  details jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE deleted_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE deletion_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read deleted products"
  ON deleted_products
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert deleted products"
  ON deleted_products
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can read deletion logs"
  ON deletion_logs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert deletion logs"
  ON deletion_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create function to clean up expired deleted products
CREATE OR REPLACE FUNCTION cleanup_expired_products()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM deleted_products
  WHERE restore_deadline < NOW();
END;
$$;

-- Create function to restore a product
CREATE OR REPLACE FUNCTION restore_product(product_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Move the product back to the productos table
  INSERT INTO productos
  SELECT
    codigo_unico,
    nombre_producto,
    fabricante,
    domicilio_fabricante,
    identificacion,
    marca,
    modelo,
    dimensiones,
    peso,
    materiales,
    caracteristicas_tecnicas,
    capacidades_limitaciones,
    certificado_url,
    qr_code_url,
    qr_version,
    qr_generated_at,
    created_at
  FROM deleted_products
  WHERE codigo_unico = product_id;

  -- Remove from deleted_products
  DELETE FROM deleted_products
  WHERE codigo_unico = product_id;
END;
$$;