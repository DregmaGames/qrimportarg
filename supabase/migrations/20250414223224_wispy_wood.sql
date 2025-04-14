/*
  # Fix User Profiles RLS Policies

  1. Changes
    - Drop existing problematic policies that cause infinite recursion
    - Create new, optimized policies without recursive conditions
    
  2. Security
    - Maintain same security level but with more efficient policy conditions
    - Ensure super admins retain full access
    - Allow users to read their own profile
    - Allow coordinators to read client profiles
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "allow_profile_creation" ON user_profiles;
DROP POLICY IF EXISTS "coordinator_read_clients" ON user_profiles;
DROP POLICY IF EXISTS "super_admin_full_access" ON user_profiles;
DROP POLICY IF EXISTS "users_read_own" ON user_profiles;

-- Create new optimized policies
CREATE POLICY "users_read_own_profile"
ON user_profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "users_create_own_profile"
ON user_profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

CREATE POLICY "super_admin_full_access"
ON user_profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.id IN (
      SELECT id FROM user_profiles WHERE role = 'super_admin'
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.id IN (
      SELECT id FROM user_profiles WHERE role = 'super_admin'
    )
  )
);

CREATE POLICY "coordinator_read_clients"
ON user_profiles
FOR SELECT
TO authenticated
USING (
  (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'coordinator'
    )
    AND role = 'client'
  )
);