/*
  # Add User Management System

  1. New Types
    - `user_role_enum`: Enum for user roles (super_admin, coordinator, client)

  2. New Tables and Columns
    - `user_profiles`: Extended user information and role management
    - `user_permissions`: Specific permissions for users
    - Add created_by column to productos and deleted_products tables

  3. Security
    - Enable RLS on new tables
    - Add policies for role-based access
*/

-- Create role enum type
CREATE TYPE user_role_enum AS ENUM ('super_admin', 'coordinator', 'client');

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users,
  role user_role_enum NOT NULL DEFAULT 'client',
  full_name text,
  company text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_permissions table
CREATE TABLE IF NOT EXISTS user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  resource text NOT NULL,
  action text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, resource, action)
);

-- Add created_by column to productos and deleted_products tables
ALTER TABLE productos
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

ALTER TABLE deleted_products
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- Policies for user_profiles

-- Super admins can do everything
CREATE POLICY "Super admins have full access to profiles"
ON user_profiles
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = auth.uid()
    AND up.role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = auth.uid()
    AND up.role = 'super_admin'
  )
);

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
ON user_profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Coordinators can read client profiles
CREATE POLICY "Coordinators can read client profiles"
ON user_profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = auth.uid()
    AND up.role = 'coordinator'
  )
  AND role = 'client'
);

-- Policies for user_permissions

-- Super admins have full access to permissions
CREATE POLICY "Super admins have full access to permissions"
ON user_permissions
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = auth.uid()
    AND up.role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = auth.uid()
    AND up.role = 'super_admin'
  )
);

-- Users can read their own permissions
CREATE POLICY "Users can read own permissions"
ON user_permissions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Drop existing policies for productos
DROP POLICY IF EXISTS "Enable all access for productos" ON productos;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON productos;
DROP POLICY IF EXISTS "Enable read access for all users" ON productos;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON productos;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON productos;

-- Add new RLS policies for productos table based on user roles

-- Super admins have full access
CREATE POLICY "Super admins have full access to products"
ON productos
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = auth.uid()
    AND up.role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = auth.uid()
    AND up.role = 'super_admin'
  )
);

-- Coordinators have full access
CREATE POLICY "Coordinators have full access to products"
ON productos
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = auth.uid()
    AND up.role = 'coordinator'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = auth.uid()
    AND up.role = 'coordinator'
  )
);

-- Clients can only access their own products
CREATE POLICY "Clients can access their own products"
ON productos
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = auth.uid()
    AND up.role = 'client'
  )
  AND created_by = auth.uid()
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = auth.uid()
    AND up.role = 'client'
  )
  AND created_by = auth.uid()
);

-- Create function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role_enum
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT role FROM user_profiles WHERE id = auth.uid();
$$;