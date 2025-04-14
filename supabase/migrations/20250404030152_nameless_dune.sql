/*
  # Remove dimensions and weight columns

  1. Changes
    - Remove 'dimensiones' column from productos table
    - Remove 'peso' column from productos table
    - Remove 'dimensiones' column from deleted_products table
    - Remove 'peso' column from deleted_products table

  Note: Using DO block to safely remove columns if they exist
*/

DO $$
BEGIN
  -- Remove columns from productos table
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'productos' AND column_name = 'dimensiones'
  ) THEN
    ALTER TABLE productos DROP COLUMN dimensiones;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'productos' AND column_name = 'peso'
  ) THEN
    ALTER TABLE productos DROP COLUMN peso;
  END IF;

  -- Remove columns from deleted_products table
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'deleted_products' AND column_name = 'dimensiones'
  ) THEN
    ALTER TABLE deleted_products DROP COLUMN dimensiones;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'deleted_products' AND column_name = 'peso'
  ) THEN
    ALTER TABLE deleted_products DROP COLUMN peso;
  END IF;
END $$;