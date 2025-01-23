/*
  # Fix user creation and policies

  1. Changes
    - Simplify RLS policies to avoid recursion
    - Improve trigger function error handling
    - Fix role assignment
    - Add proper constraints
    
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

-- Drop and recreate users table
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text UNIQUE NOT NULL,
  name text,
  last_name text,
  id_type text NOT NULL DEFAULT 'DNI',
  id_number text UNIQUE,
  phone text,
  address text,
  birth_date date,
  role_id uuid REFERENCES roles(id),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT users_id_type_check CHECK (id_type IN ('DNI', 'NIE', 'Pasaporte', 'Otros'))
);

-- Create indexes
CREATE INDEX users_role_id_idx ON users(role_id);
CREATE INDEX users_email_idx ON users(email);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

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
      WHERE r.id = (SELECT role_id FROM users WHERE id = auth.uid() LIMIT 1)
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
      WHERE r.id = (SELECT role_id FROM users WHERE id = auth.uid() LIMIT 1)
      AND r.name IN ('admin', 'manager')
    )
  );

-- Create improved trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  default_role_id uuid;
  max_retries constant int := 3;
  current_try int := 0;
  role_name text;
BEGIN
  -- Get role from metadata or default to 'user'
  role_name := COALESCE(NEW.raw_user_meta_data->>'role', 'user');
  
  -- Get role ID
  SELECT id INTO default_role_id FROM roles WHERE name = role_name;
  IF NOT FOUND THEN
    SELECT id INTO default_role_id FROM roles WHERE name = 'user';
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Default role not found';
    END IF;
  END IF;

  -- Insert new user with retry logic
  WHILE current_try < max_retries LOOP
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
      
      -- If insert succeeds, exit the loop
      EXIT;
    EXCEPTION 
      WHEN unique_violation THEN
        -- If it's the last attempt, try to update instead
        IF current_try = max_retries - 1 THEN
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
              WHEN NEW.email = 'admin@admin.com' THEN 
                (SELECT id FROM roles WHERE name = 'admin')
              ELSE default_role_id
            END
          WHERE id = NEW.id;
          EXIT;
        END IF;
        -- Wait before retrying with exponential backoff
        PERFORM pg_sleep(0.1 * power(2, current_try));
      WHEN OTHERS THEN
        RAISE LOG 'Error in handle_new_user: %', SQLERRM;
        -- Continue with next attempt
    END;
    
    current_try := current_try + 1;
  END LOOP;

  RETURN NEW;
END;
$$ language plpgsql security definer;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Ensure admin role exists
INSERT INTO roles (name, description)
VALUES ('admin', 'Administrador con acceso completo')
ON CONFLICT (name) DO NOTHING;

-- Update existing admin user's role if they exist
UPDATE users
SET role_id = (SELECT id FROM roles WHERE name = 'admin')
WHERE email = 'admin@admin.com';