/*
  # Add QR code support for products

  1. New Fields
    - `qr_code_url` (text): URL to the stored QR code image
    - `qr_version` (integer): Version number for certificate updates
    - `qr_generated_at` (timestamp): When the QR code was generated

  2. Changes
    - Add new columns to productos table
    - Set default values for new fields
*/

ALTER TABLE productos
ADD COLUMN IF NOT EXISTS qr_code_url text,
ADD COLUMN IF NOT EXISTS qr_version integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS qr_generated_at timestamptz DEFAULT now();