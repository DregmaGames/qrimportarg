/*
  # Add DJC Management

  1. Changes
    - Add 'djc_documento' column to store DJC document URL
    - Add 'djc_fecha' column to store DJC upload date
    - Add 'qr_generado' boolean column to track QR status
    - Add 'djc_estado' enum type for DJC status tracking
    - Update deleted_products table to include new columns

  2. Security
    - Maintain existing RLS policies
*/

-- Create enum type for DJC status
DO $$ BEGIN
  CREATE TYPE djc_estado_enum AS ENUM ('pendiente', 'cargado');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add new columns to productos table
ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS djc_documento text,
  ADD COLUMN IF NOT EXISTS djc_fecha timestamptz,
  ADD COLUMN IF NOT EXISTS qr_generado boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS djc_estado djc_estado_enum DEFAULT 'pendiente';

-- Add new columns to deleted_products table
ALTER TABLE deleted_products
  ADD COLUMN IF NOT EXISTS djc_documento text,
  ADD COLUMN IF NOT EXISTS djc_fecha timestamptz,
  ADD COLUMN IF NOT EXISTS qr_generado boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS djc_estado djc_estado_enum DEFAULT 'pendiente';