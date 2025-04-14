/*
  # Add DJC fields to productos table

  1. Changes
    - Add DJC-related columns to productos table:
      - djc_documento (text, nullable): URL to the DJC document
      - djc_fecha (timestamptz, nullable): When the DJC was uploaded
      - djc_estado (enum): Current status of DJC (pendiente/cargado)
      - qr_generado (boolean): Whether QR code has been generated
  
  2. Security
    - Update RLS policies to allow DJC updates
*/

-- Add DJC fields to productos table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'productos' AND column_name = 'djc_documento') THEN
    ALTER TABLE productos ADD COLUMN djc_documento text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'productos' AND column_name = 'djc_fecha') THEN
    ALTER TABLE productos ADD COLUMN djc_fecha timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'productos' AND column_name = 'djc_estado') THEN
    ALTER TABLE productos ADD COLUMN djc_estado djc_estado_enum DEFAULT 'pendiente';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'productos' AND column_name = 'qr_generado') THEN
    ALTER TABLE productos ADD COLUMN qr_generado boolean DEFAULT false;
  END IF;
END $$;

-- Create storage bucket for DJC documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('djc_documents', 'djc_documents', true)
ON CONFLICT (id) DO NOTHING;

-- Update RLS policies for productos table
DO $$ 
BEGIN
  -- Drop existing update policy if it exists
  DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.productos;
  
  -- Create new update policy that explicitly allows DJC updates
  CREATE POLICY "Enable update for authenticated users only" 
    ON public.productos
    FOR UPDATE 
    TO authenticated 
    USING (true)
    WITH CHECK (true);

  -- Ensure RLS is enabled
  ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
END $$;