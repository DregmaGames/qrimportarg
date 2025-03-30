/*
  # Add INSERT policy for users table

  1. Changes
    - Add INSERT policy to allow users to create their own profile during registration
    - Policy ensures users can only create a profile with their own auth ID

  2. Security
    - Users can only insert a row where the ID matches their auth ID
    - Maintains data integrity by preventing users from creating profiles for others
*/

CREATE POLICY "Users can insert own profile"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);