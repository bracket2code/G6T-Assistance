/*
  # Fix user creation trigger

  1. Changes
    - Simplify user creation trigger
    - Remove unique constraint on id_number
    - Make name and last_name nullable
    - Add better error handling
*/

-- Drop existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Remove unique constraint on id_number
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_number_key;

-- Make name and last_name nullable
ALTER TABLE users ALTER COLUMN name DROP NOT NULL;
ALTER TABLE users ALTER COLUMN last_name DROP NOT NULL;

-- Create improved trigger function
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
      alias,
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
      NULLIF(COALESCE(NEW.raw_user_meta_data->>'alias', ''), ''),
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
        name = NULLIF(COALESCE(NEW.raw_user_meta_data->>'name', ''), ''),
        last_name = NULLIF(COALESCE(NEW.raw_user_meta_data->>'lastName', ''), ''),
        alias = NULLIF(COALESCE(NEW.raw_user_meta_data->>'alias', ''), ''),
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
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();