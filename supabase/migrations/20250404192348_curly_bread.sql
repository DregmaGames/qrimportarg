/*
  # Add usuarios table for extended user information

  1. New Tables
    - `usuarios`
      - `id` (uuid, primary key)
      - `auth_user_id` (uuid, references auth.users)
      - `razon_social` (text)
      - `cuit` (text)
      - `marca` (text)
      - `domicilio_legal` (text)
      - `domicilio_planta` (text)
      - `telefono` (text)
      - `email` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create usuarios table
CREATE TABLE IF NOT EXISTS usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid REFERENCES auth.users(id),
  razon_social text NOT NULL,
  cuit text NOT NULL,
  marca text NOT NULL,
  domicilio_legal text NOT NULL,
  domicilio_planta text NOT NULL,
  telefono text NOT NULL,
  email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(auth_user_id),
  UNIQUE(cuit),
  UNIQUE(email)
);

-- Enable RLS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own profile"
ON usuarios FOR SELECT
TO authenticated
USING (auth_user_id = auth.uid());

CREATE POLICY "Users can insert own profile"
ON usuarios FOR INSERT
TO authenticated
WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "Users can update own profile"
ON usuarios FOR UPDATE
TO authenticated
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

-- Create function to check if user has completed profile
CREATE OR REPLACE FUNCTION public.has_completed_profile(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM usuarios
    WHERE auth_user_id = user_id
  );
$$;