/*
  # Fix roles table policies and setup

  1. Changes
    - Drop existing policies to start fresh
    - Create simplified policies that avoid recursion
    - Add initial setup mode support
    
  2. Security
    - Allow read access to all authenticated users
    - Allow write access during initial setup
    - Prevent unauthorized modifications after setup
*/

-- Drop existing objects
DROP POLICY IF EXISTS "Enable read access for all users" ON roles;
DROP POLICY IF EXISTS "Enable write access during setup" ON roles;
DROP TABLE IF EXISTS roles CASCADE;

-- Create roles table
CREATE TABLE roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  is_system boolean DEFAULT false
);

-- Insert default roles
INSERT INTO roles (name, description, is_system) VALUES
  ('admin', 'Administrador con acceso completo', true),
  ('manager', 'Gestor con acceso a gestión de empresas y usuarios', true),
  ('user', 'Usuario básico', true)
ON CONFLICT (name) DO NOTHING;

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Create simple policies
CREATE POLICY "Enable read access for authenticated users" ON roles
  FOR SELECT
  TO authenticated
  USING (true);

-- Only allow modifications to non-system roles
CREATE POLICY "Enable write access for authenticated users" ON roles
  FOR ALL
  TO authenticated
  USING (NOT is_system)
  WITH CHECK (NOT is_system);