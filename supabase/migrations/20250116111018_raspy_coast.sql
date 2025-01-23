/*
  # Fix user creation process

  1. Changes
    - Make name and last_name nullable to allow initial creation
    - Add default role assignment
    - Improve trigger function error handling
    - Add missing indexes
  
  2. Security
    - Maintain existing RLS policies
    - Ensure proper role assignment
*/

-- Make name and last_name nullable to allow initial creation
ALTER TABLE users 
ALTER COLUMN name DROP NOT NULL,
ALTER COLUMN last_name DROP NOT NULL;

-- Create function to get default role
CREATE OR REPLACE FUNCTION get_default_role()
RETURNS uuid AS $$
DECLARE
  default_role_id uuid;
BEGIN
  -- Try to get user role first
  SELECT id INTO default_role_id FROM roles WHERE name = 'user';
  
  -- If no user role exists, create it
  IF default_role_id IS NULL THEN
    INSERT INTO roles (name, description)
    VALUES ('user', 'Usuario básico')
    RETURNING id INTO default_role_id;
  END IF;
  
  RETURN default_role_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update trigger function with better error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  default_role_id uuid;
BEGIN
  -- Get default role ID
  default_role_id := get_default_role();

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
      NULLIF(COALESCE(NEW.raw_user_meta_data->>'name', ''), ''),
      NULLIF(COALESCE(NEW.raw_user_meta_data->>'lastName', ''), ''),
      COALESCE(NEW.raw_user_meta_data->>'idType', 'DNI'),
      COALESCE(NEW.raw_user_meta_data->>'idNumber', NEW.id),
      NULLIF(COALESCE(NEW.raw_user_meta_data->>'phone', ''), ''),
      NULLIF(COALESCE(NEW.raw_user_meta_data->>'address', ''), ''),
      CASE 
        WHEN NEW.raw_user_meta_data->>'birthDate' IS NULL OR NEW.raw_user_meta_data->>'birthDate' = ''
        THEN NULL
        ELSE (NEW.raw_user_meta_data->>'birthDate')::date
      END,
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
        name = COALESCE(NULLIF(NEW.raw_user_meta_data->>'name', ''), name),
        last_name = COALESCE(NULLIF(NEW.raw_user_meta_data->>'lastName', ''), last_name),
        id_type = COALESCE(NEW.raw_user_meta_data->>'idType', id_type),
        id_number = COALESCE(NEW.raw_user_meta_data->>'idNumber', id_number),
        phone = NULLIF(COALESCE(NEW.raw_user_meta_data->>'phone', ''), ''),
        address = NULLIF(COALESCE(NEW.raw_user_meta_data->>'address', ''), ''),
        birth_date = CASE 
          WHEN NEW.raw_user_meta_data->>'birthDate' IS NULL OR NEW.raw_user_meta_data->>'birthDate' = ''
          THEN birth_date
          ELSE (NEW.raw_user_meta_data->>'birthDate')::date
        END,
        role_id = CASE
          WHEN NEW.email = 'admin@admin.com' THEN 
            (SELECT id FROM roles WHERE name = 'admin')
          ELSE role_id
        END
      WHERE id = NEW.id;
    WHEN OTHERS THEN
      -- Log error but don't fail
      RAISE LOG 'Error in handle_new_user: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Add missing indexes
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_role_id_idx ON users(role_id);
CREATE INDEX IF NOT EXISTS users_id_number_idx ON users(id_number);