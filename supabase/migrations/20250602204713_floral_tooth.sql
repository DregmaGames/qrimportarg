/*
  # Add delete_product function
  
  1. New Functions
     - `delete_product` - Moves a product to the deleted_products table and adds metadata about the deletion
       - Parameters:
         - `product_id` (uuid) - The ID of the product to delete
         - `deleted_by_id` (uuid) - The ID of the user performing the deletion
  
  2. Purpose
     - Implements soft deletion for products
     - Tracks deletion metadata
     - Sets a 30-day restore deadline
*/

CREATE OR REPLACE FUNCTION public.delete_product(product_id uuid, deleted_by_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  product_record productos;
  deletion_details jsonb;
BEGIN
  -- Get the product to be deleted
  SELECT * INTO product_record FROM productos WHERE codigo_unico = product_id;
  
  -- If product doesn't exist, return false
  IF product_record IS NULL THEN
    RETURN false;
  END IF;
  
  -- Create deletion details for logging
  deletion_details := jsonb_build_object(
    'nombre_producto', product_record.nombre_producto,
    'marca', product_record.marca,
    'modelo', product_record.modelo,
    'fabricante', product_record.fabricante
  );
  
  -- Insert deletion log
  INSERT INTO deletion_logs (
    action_type,
    product_id,
    performed_by,
    details
  ) VALUES (
    'delete',
    product_id,
    deleted_by_id,
    deletion_details
  );
  
  -- Move the product to deleted_products
  INSERT INTO deleted_products (
    codigo_unico,
    nombre_producto,
    fabricante,
    domicilio_fabricante,
    identificacion,
    marca,
    modelo,
    materiales,
    caracteristicas_tecnicas,
    capacidades_limitaciones,
    certificado_url,
    qr_code_url,
    qr_version,
    qr_generated_at,
    created_at,
    deletion_timestamp,
    deleted_by,
    restore_deadline,
    djc_documento,
    djc_fecha,
    qr_generado,
    djc_estado,
    created_by,
    resolution
  ) VALUES (
    product_record.codigo_unico,
    product_record.nombre_producto,
    product_record.fabricante,
    product_record.domicilio_fabricante,
    product_record.identificacion,
    product_record.marca,
    product_record.modelo,
    product_record.materiales,
    product_record.caracteristicas_tecnicas,
    product_record.capacidades_limitaciones,
    product_record.certificado_url,
    product_record.qr_code_url,
    product_record.qr_version,
    product_record.qr_generated_at,
    product_record.created_at,
    NOW(),
    deleted_by_id,
    NOW() + INTERVAL '30 days',
    product_record.djc_documento,
    product_record.djc_fecha,
    product_record.qr_generado,
    product_record.djc_estado,
    product_record.created_by,
    product_record.resolution
  );
  
  -- Delete the product from productos
  DELETE FROM productos WHERE codigo_unico = product_id;
  
  RETURN true;
END;
$$;

-- Add comment to the function
COMMENT ON FUNCTION public.delete_product IS 'Moves a product to deleted_products table and logs the deletion with a 30-day restore deadline';