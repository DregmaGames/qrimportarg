/*
  # Create productos table

  1. New Tables
    - `productos`
      - `codigo_unico` (uuid, primary key)
      - `nombre_producto` (text, required)
      - `fabricante` (text, required)
      - `domicilio_fabricante` (text, required)
      - `identificacion` (text, required)
      - `created_at` (timestamp with timezone, auto-generated)

  2. Security
    - Enable RLS on `productos` table
    - Add policy for public access (no auth required for this version)
*/

CREATE TABLE IF NOT EXISTS productos (
  codigo_unico uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_producto text NOT NULL,
  fabricante text NOT NULL,
  domicilio_fabricante text NOT NULL,
  identificacion text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (no auth required for this version)
CREATE POLICY "Public access policy"
  ON productos
  FOR ALL
  USING (true)
  WITH CHECK (true);