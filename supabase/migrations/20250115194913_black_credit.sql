-- First ensure admin role exists
INSERT INTO roles (name, description)
VALUES ('admin', 'Administrador con acceso completo')
ON CONFLICT (name) DO NOTHING;

-- Update existing admin user's role if they exist
UPDATE users
SET role_id = (SELECT id FROM roles WHERE name = 'admin')
WHERE email = 'admin@admin.com';

-- Create policy for admin users to manage all users
CREATE POLICY "Enable admin users to manage all users"
  ON users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE u.id = auth.uid() AND r.name = 'admin'
    )
  );

-- Create policy for managers to manage non-admin users
CREATE POLICY "Enable managers to manage non-admin users"
  ON users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE u.id = auth.uid() AND r.name = 'manager'
    ) AND
    NOT EXISTS (
      SELECT 1 FROM roles r
      WHERE r.id = users.role_id AND r.name = 'admin'
    )
  );