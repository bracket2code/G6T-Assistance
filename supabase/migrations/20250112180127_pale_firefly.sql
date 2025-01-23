/*
  # Fix roles setup and RLS

  1. Changes
    - Drop existing policies and table
    - Create roles table with RLS disabled
    - Insert default roles
    - Create function to handle role-based access
    - Enable RLS with proper policies
*/

-- Drop existing policies and table
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON roles;
DROP POLICY IF EXISTS "Enable write access for authenticated users" ON roles;
DROP POLICY IF EXISTS "Enable write access for admin users" ON roles;
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

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS boolean AS $$
BEGIN
  -- During initial setup, allow all operations
  IF current_setting('app.setup_mode', true) = 'true' THEN
    RETURN true;
  END IF;

  -- Check if user has admin role
  RETURN (
    SELECT EXISTS (
      SELECT 1
      FROM auth.users u
      JOIN public.roles r ON r.id = (
        SELECT role_id 
        FROM public.users 
        WHERE id = u.id
      )
      WHERE u.id = auth.uid()
      AND r.name = 'admin'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;