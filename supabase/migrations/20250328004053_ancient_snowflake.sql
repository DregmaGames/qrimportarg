/*
  # Initial Schema Setup for DJC Management System

  1. New Tables
    - `users`
      - Core user information and company details
      - Includes authentication data integration
    - `products`
      - Product compliance declarations
      - Includes file storage and QR code references
    - `representatives`
      - Company representatives authorized for DJC
      - Tracks inclusion in declarations

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated access
    - Implement role-based access control
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  company_name text NOT NULL,
  tax_id text NOT NULL UNIQUE,
  brand_name text NOT NULL,
  legal_address text NOT NULL,
  warehouse_address text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT email_validation CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL,
  uuid text UNIQUE DEFAULT gen_random_uuid()::text,
  manufacturer text NOT NULL,
  manufacturer_address text NOT NULL,
  brand text NOT NULL,
  model text NOT NULL,
  specs jsonb NOT NULL DEFAULT '{}',
  djc_url text,
  cert_url text,
  qr_code text,
  expiry_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create representatives table
CREATE TABLE IF NOT EXISTS representatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  position text NOT NULL,
  include_in_djc boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE representatives ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can read own products"
  ON products
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own products"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products"
  ON products
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own products"
  ON products
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own representatives"
  ON representatives
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own representatives"
  ON representatives
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_representatives_updated_at
  BEFORE UPDATE ON representatives
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();