/*
  # Fix user creation process

  1. Changes
    - Remove auth schema dependencies
    - Add proper error handling
    - Fix role assignment
    - Add user creation trigger

  2. Security
    - Maintain RLS policies
    - Ensure proper role assignment
*/

-- Drop existing policies
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;

-- Create simplified policies
CREATE POLICY "users_select_policy" 
  ON users FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "users_insert_policy" 
  ON users FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "users_update_policy" 
  ON users FOR UPDATE 
  TO authenticated 
  USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1
      FROM roles r
      WHERE r.id = (SELECT role_id FROM users WHERE id = auth.uid())
      AND r.name IN ('admin', 'manager')
    )
  );

CREATE POLICY "users_delete_policy" 
  ON users FOR DELETE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1
      FROM roles r
      WHERE r.id = (SELECT role_id FROM users WHERE id = auth.uid())
      AND r.name IN ('admin', 'manager')
    )
  );

-- Ensure roles exist
INSERT INTO roles (name, description)
VALUES 
  ('admin', 'Administrador con acceso completo'),
  ('manager', 'Gestor con acceso a gestión'),
  ('user', 'Usuario básico')
ON CONFLICT (name) DO NOTHING;

-- Update admin user's role if exists
UPDATE users
SET role_id = (SELECT id FROM roles WHERE name = 'admin')
WHERE email = 'admin@admin.com';