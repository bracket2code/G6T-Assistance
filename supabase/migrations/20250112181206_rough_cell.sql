-- Drop existing objects
DROP POLICY IF EXISTS "Enable read access for all users" ON roles;
DROP POLICY IF EXISTS "Enable write access during setup" ON roles;
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

-- Create simple policies
CREATE POLICY "Enable read access for all users" ON roles
  FOR SELECT
  USING (true);

CREATE POLICY "Enable write access for all users" ON roles
  FOR ALL
  USING (true)
  WITH CHECK (true);