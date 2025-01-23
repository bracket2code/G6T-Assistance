/*
  # Fix roles table setup and RLS

  1. Changes
    - Drop existing table and policies
    - Create roles table with RLS disabled initially
    - Insert default roles
    - Enable RLS and create policies
*/

-- Drop existing policies and table
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON roles;
DROP POLICY IF EXISTS "Enable write access for authenticated users" ON roles;
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

-- Enable RLS after initial data is inserted
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all authenticated users" ON roles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable write access for admin users" ON roles
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');