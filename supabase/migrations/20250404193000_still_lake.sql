/*
  # Fix user_profiles policies to prevent recursion

  1. Changes
    - Drop existing policies that may cause recursion
    - Create new, optimized policies for user_profiles table
    
  2. Security
    - Enable RLS on user_profiles table (in case it was disabled)
    - Add policy for super_admin access
    - Add policy for coordinator access to client profiles
    - Add policy for users to read their own profile
    - Add policy for initial profile creation during registration
*/

-- First, drop existing policies to start fresh
DROP POLICY IF EXISTS "Super admins have full access to profiles" ON user_profiles;
DROP POLICY IF EXISTS "Coordinators can read client profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;

-- Ensure RLS is enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy for super admins - full access without recursion
CREATE POLICY "super_admin_full_access"
ON user_profiles
FOR ALL
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM user_profiles WHERE role = 'super_admin'::user_role_enum
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM user_profiles WHERE role = 'super_admin'::user_role_enum
  )
);

-- Policy for coordinators to read client profiles
CREATE POLICY "coordinator_read_clients"
ON user_profiles
FOR SELECT
TO authenticated
USING (
  (auth.uid() IN (
    SELECT id FROM user_profiles WHERE role = 'coordinator'::user_role_enum
  ) AND role = 'client'::user_role_enum)
  OR
  id = auth.uid()
);

-- Policy for users to read their own profile
CREATE POLICY "users_read_own"
ON user_profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Policy to allow initial profile creation during registration
CREATE POLICY "allow_profile_creation"
ON user_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);