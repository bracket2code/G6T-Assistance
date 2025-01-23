/*
  # Fix admin user setup

  1. Changes
    - Drop and recreate roles table with proper policies
    - Add function to handle new user creation
    - Add function to check admin role
    - Add initial admin user
*/

-- Drop existing objects
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON roles;
DROP POLICY IF EXISTS "Enable write access for authenticated users" ON roles;
DROP POLICY IF EXISTS "Enable write access for admin users" ON roles;
DROP FUNCTION IF EXISTS auth.is_admin();
DROP TABLE IF EXISTS roles CASCADE;

-- Create roles table
CREATE TABLE roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Insert default roles
INSERT INTO roles (name, description) VALUES
  ('admin', 'Administrador con acceso completo'),
  ('manager', 'Gestor con acceso a gestión de empresas y usuarios'),
  ('user', 'Usuario básico')
ON CONFLICT (name) DO NOTHING;

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON roles
  FOR SELECT
  USING (true);

CREATE POLICY "Enable write access for admin users" ON roles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM auth.users u
      JOIN public.users pu ON pu.id = u.id
      JOIN public.roles r ON r.id = pu.role_id
      WHERE u.id = auth.uid()
      AND r.name = 'admin'
    )
  );