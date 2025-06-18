/*
  # Add numero_djc column to djc table

  1. Changes
    - Add `numero_djc` column to the `djc` table
    
  This migration adds the missing column that's being referenced in the application code.
*/

-- Add numero_djc column to djc table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'djc' 
    AND column_name = 'numero_djc'
  ) THEN
    ALTER TABLE public.djc ADD COLUMN numero_djc text;
  END IF;
END $$;