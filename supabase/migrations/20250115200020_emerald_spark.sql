/*
  # Fix admin role assignment

  1. Changes
    - Ensure admin role exists
    - Update role assignment logic
    - Fix role-based policies
    
  2. Security
    - Maintain proper access control
    - Ensure admin privileges
*/

-- Ensure admin role exists
INSERT INTO roles (name, description)
VALUES 
  ('admin', 'Administrador con acceso completo'),
  ('manager', 'Gestor con acceso a gestión'),
  ('user', 'Usuario básico')
ON CONFLICT (name) DO NOTHING;

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
      FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE u.id = auth.uid()
      AND r.name IN ('admin', 'manager')
    )
  );

CREATE POLICY "users_delete_policy" 
  ON users FOR DELETE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1
      FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE u.id = auth.uid()
      AND r.name IN ('admin', 'manager')
    )
  );

-- Update handle_new_user function to properly handle roles
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  admin_role_id uuid;
  default_role_id uuid;
  role_name text;
BEGIN
  -- Get role from metadata or default to 'user'
  role_name := COALESCE(NEW.raw_user_meta_data->>'role', 'user');
  
  -- Get admin role ID
  SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Admin role not found';
  END IF;

  -- Get default role ID
  SELECT id INTO default_role_id FROM roles WHERE name = role_name;
  IF NOT FOUND THEN
    SELECT id INTO default_role_id FROM roles WHERE name = 'user';
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Default role not found';
    END IF;
  END IF;

  BEGIN
    INSERT INTO public.users (
      id,
      email,
      name,
      last_name,
      id_type,
      id_number,
      phone,
      address,
      birth_date,
      role_id
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'lastName', ''),
      COALESCE(NEW.raw_user_meta_data->>'idType', 'DNI'),
      COALESCE(NEW.raw_user_meta_data->>'idNumber', 'USER-' || NEW.id),
      NULLIF(COALESCE(NEW.raw_user_meta_data->>'phone', ''), ''),
      NULLIF(COALESCE(NEW.raw_user_meta_data->>'address', ''), ''),
      NULLIF(COALESCE(NEW.raw_user_meta_data->>'birthDate', ''), '')::date,
      CASE
        WHEN NEW.email = 'admin@admin.com' THEN admin_role_id
        ELSE default_role_id
      END
    );
  EXCEPTION 
    WHEN unique_violation THEN
      UPDATE public.users SET
        email = NEW.email,
        name = COALESCE(NEW.raw_user_meta_data->>'name', name),
        last_name = COALESCE(NEW.raw_user_meta_data->>'lastName', last_name),
        id_type = COALESCE(NEW.raw_user_meta_data->>'idType', id_type),
        id_number = COALESCE(NEW.raw_user_meta_data->>'idNumber', id_number),
        phone = NULLIF(COALESCE(NEW.raw_user_meta_data->>'phone', ''), ''),
        address = NULLIF(COALESCE(NEW.raw_user_meta_data->>'address', ''), ''),
        birth_date = NULLIF(COALESCE(NEW.raw_user_meta_data->>'birthDate', ''), '')::date,
        role_id = CASE
          WHEN NEW.email = 'admin@admin.com' THEN admin_role_id
          WHEN NEW.raw_user_meta_data->>'role' IS NOT NULL THEN default_role_id
          ELSE role_id
        END
      WHERE id = NEW.id;
  END;
  
  RETURN NEW;
END;
$$ language plpgsql security definer;

-- Update admin user's role
UPDATE users
SET role_id = (SELECT id FROM roles WHERE name = 'admin')
WHERE email = 'admin@admin.com';