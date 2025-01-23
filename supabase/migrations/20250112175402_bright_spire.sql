/*
  # Fix roles table and add default roles

  1. Changes
    - Recreate roles table with proper structure
    - Add default roles with correct names
    - Enable RLS and policies
*/

-- Recreate roles table
DROP TABLE IF EXISTS roles CASCADE;
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

-- Create policies for roles table
CREATE POLICY "Enable read access for all authenticated users" ON roles
  FOR SELECT
  TO authenticated
  USING (true);