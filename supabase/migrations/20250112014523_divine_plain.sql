/*
  # Create user roles and permissions schema

  1. New Tables
    - `roles`: Stores user roles (admin, manager, user)
    - `permissions`: Stores available permissions
    - `role_permissions`: Junction table linking roles to permissions
    - `users`: Base users table with role reference

  2. Security
    - Enable RLS on all tables
    - Add policies for admin access

  3. Initial Data
    - Insert default roles
    - Insert default permissions
    - Assign permissions to roles
*/

-- Create users table first
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  last_name text NOT NULL,
  dni text UNIQUE NOT NULL,
  phone text,
  address text,
  birth_date date,
  created_at timestamptz DEFAULT now()
);

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id uuid REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Add role_id to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id uuid REFERENCES roles(id);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow full access to admins" ON users
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Allow full access to admins" ON roles
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Allow full access to admins" ON permissions
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Allow full access to admins" ON role_permissions
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Insert default roles
INSERT INTO roles (name, description) VALUES
  ('admin', 'Administrador con acceso completo'),
  ('manager', 'Gestor con acceso a gestión de empresas y usuarios'),
  ('user', 'Usuario básico')
ON CONFLICT (name) DO NOTHING;

-- Insert default permissions
INSERT INTO permissions (name, description) VALUES
  ('manage_users', 'Gestionar usuarios'),
  ('manage_businesses', 'Gestionar empresas'),
  ('view_users', 'Ver usuarios'),
  ('view_businesses', 'Ver empresas'),
  ('manage_shifts', 'Gestionar turnos'),
  ('view_shifts', 'Ver turnos')
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to roles (admin gets all permissions)
DO $$
DECLARE
  admin_role_id uuid;
  manager_role_id uuid;
  user_role_id uuid;
  perm_id uuid;
BEGIN
  -- Get role IDs
  SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';
  SELECT id INTO manager_role_id FROM roles WHERE name = 'manager';
  SELECT id INTO user_role_id FROM roles WHERE name = 'user';

  -- Assign all permissions to admin
  FOR perm_id IN SELECT id FROM permissions
  LOOP
    INSERT INTO role_permissions (role_id, permission_id)
    VALUES (admin_role_id, perm_id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Assign manager permissions
  FOR perm_id IN SELECT id FROM permissions 
    WHERE name IN ('manage_users', 'manage_businesses', 'view_users', 'view_businesses', 'manage_shifts')
  LOOP
    INSERT INTO role_permissions (role_id, permission_id)
    VALUES (manager_role_id, perm_id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Assign user permissions
  FOR perm_id IN SELECT id FROM permissions 
    WHERE name IN ('view_shifts', 'manage_shifts')
  LOOP
    INSERT INTO role_permissions (role_id, permission_id)
    VALUES (user_role_id, perm_id)
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;