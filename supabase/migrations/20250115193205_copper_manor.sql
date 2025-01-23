/*
  # Fix admin user role

  1. Changes
    - Ensure admin@admin.com user has admin role
    - Add policy to allow admin users to update roles
*/

-- First ensure admin role exists
INSERT INTO roles (name, description)
VALUES ('admin', 'Administrador con acceso completo')
ON CONFLICT (name) DO NOTHING;

-- Update admin user's role
UPDATE users
SET role_id = (SELECT id FROM roles WHERE name = 'admin')
WHERE email = 'admin@admin.com';

-- Add policy for admin users to update roles
CREATE POLICY "Enable admin users to update roles"
  ON users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE u.id = auth.uid() AND r.name = 'admin'
    )
  );