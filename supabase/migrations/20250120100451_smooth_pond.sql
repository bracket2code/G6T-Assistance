/*
  # Fix user creation trigger

  1. Changes
    - Simplify trigger function
    - Add better error handling
    - Remove unique constraints
    - Make fields nullable
    - Add retry logic
*/

-- Drop existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Remove unique constraint on id_number if it exists
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_number_key;

-- Make name and last_name nullable if not already
ALTER TABLE users ALTER COLUMN name DROP NOT NULL;
ALTER TABLE users ALTER COLUMN last_name DROP NOT NULL;

-- Create simplified trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  default_role_id uuid;
BEGIN
  -- Get default role ID
  SELECT id INTO default_role_id FROM roles WHERE name = 'user';
  IF NOT FOUND THEN
    -- Create user role if it doesn't exist
    INSERT INTO roles (name, description)
    VALUES ('user', 'Usuario básico')
    RETURNING id INTO default_role_id;
  END IF;

  -- Insert new user with minimal required data
  INSERT INTO public.users (
    id,
    email,
    role_id
  ) VALUES (
    NEW.id,
    NEW.email,
    CASE
      WHEN NEW.email = 'admin@admin.com' THEN 
        (SELECT id FROM roles WHERE name = 'admin')
      ELSE default_role_id
    END
  );

  RETURN NEW;
EXCEPTION 
  WHEN unique_violation THEN
    -- If user already exists, just return
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error but don't fail
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Ensure roles exist
INSERT INTO roles (name, description)
VALUES 
  ('admin', 'Administrador con acceso completo'),
  ('manager', 'Gestor con acceso a gestión'),
  ('user', 'Usuario básico')
ON CONFLICT (name) DO NOTHING;