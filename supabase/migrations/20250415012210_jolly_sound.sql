/*
  # Add resolution field to productos table

  1. Changes
    - Add resolution column to productos table
    - Add resolution column to deleted_products table
    - Set default value to first resolution option
*/

ALTER TABLE productos
ADD COLUMN IF NOT EXISTS resolution text DEFAULT 'Res. SIYC N° 16/2025';

ALTER TABLE deleted_products
ADD COLUMN IF NOT EXISTS resolution text DEFAULT 'Res. SIYC N° 16/2025';