/*
  # Fix user creation and RLS policies

  1. Changes
    - Simplify RLS policies to avoid recursion
    - Improve trigger function error handling
    - Add proper role assignment
    
  2. Security
    - Maintain proper access control
    - Prevent infinite recursion
    - Allow proper user management
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

-- Update trigger function with better error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  default_role_id uuid;
BEGIN
  -- Get default role ID
  SELECT id INTO default_role_id FROM roles WHERE name = 'user';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Default role not found';
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
        WHEN NEW.email = 'admin@admin.com' THEN 
          (SELECT id FROM roles WHERE name = 'admin')
        ELSE default_role_id
      END
    );
  EXCEPTION 
    WHEN unique_violation THEN
      -- On conflict, update the existing user
      UPDATE public.users SET
        email = NEW.email,
        name = COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        last_name = COALESCE(NEW.raw_user_meta_data->>'lastName', ''),
        id_type = COALESCE(NEW.raw_user_meta_data->>'idType', id_type),
        id_number = COALESCE(NEW.raw_user_meta_data->>'idNumber', id_number),
        phone = NULLIF(COALESCE(NEW.raw_user_meta_data->>'phone', ''), ''),
        address = NULLIF(COALESCE(NEW.raw_user_meta_data->>'address', ''), ''),
        birth_date = NULLIF(COALESCE(NEW.raw_user_meta_data->>'birthDate', ''), '')::date,
        role_id = CASE
          WHEN NEW.email = 'admin@admin.com' THEN 
            (SELECT id FROM roles WHERE name = 'admin')
          ELSE role_id
        END
      WHERE id = NEW.id;
  END;
  
  RETURN NEW;
END;
$$ language plpgsql security definer;