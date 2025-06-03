/*
  # Add DJC (Declaraciones Juradas de Conformidad) tables

  1. New Tables
    - `djc`: Stores DJC documents and form data
    
  2. Security
    - Enable RLS
    - Add policies for user access
*/

-- Create djc table
CREATE TABLE IF NOT EXISTS djc (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resolucion text NOT NULL,
  razon_social text NOT NULL,
  cuit text,
  marca text NOT NULL,
  domicilio_legal text NOT NULL,
  domicilio_planta text NOT NULL,
  telefono text NOT NULL,
  email text NOT NULL,
  representante_nombre text,
  representante_domicilio text,
  representante_cuit text,
  codigo_producto text NOT NULL,
  fabricante text NOT NULL,
  identificacion_producto text NOT NULL,
  reglamentos text NOT NULL,
  normas_tecnicas text NOT NULL,
  documento_evaluacion text NOT NULL,
  enlace_declaracion text,
  fecha_lugar text NOT NULL,
  firma_url text,
  pdf_url text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  producto_id text
);

-- Enable RLS
ALTER TABLE djc ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "enable_auth_delete_djc"
ON djc
FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "enable_auth_insert_djc"
ON djc
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "enable_auth_update_djc"
ON djc
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "enable_auth_select_djc"
ON djc
FOR SELECT
TO authenticated
USING (auth.uid() = created_by);

-- Add index on producto_id for performance
CREATE INDEX IF NOT EXISTS djc_producto_id_idx ON djc(producto_id);
CREATE INDEX IF NOT EXISTS djc_created_by_idx ON djc(created_by);