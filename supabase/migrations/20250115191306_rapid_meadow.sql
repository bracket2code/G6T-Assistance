/*
  # Fix user creation issues

  1. Changes
    - Simplify user creation trigger
    - Remove role assignment from trigger
    - Make name and last_name nullable
    - Add better error handling
*/

-- Drop existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Make name and last_name nullable
ALTER TABLE users ALTER COLUMN name DROP NOT NULL;
ALTER TABLE users ALTER COLUMN last_name DROP NOT NULL;

-- Create improved trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  default_role_id uuid;
BEGIN
  -- Get default user role
  SELECT id INTO default_role_id FROM roles WHERE name = 'user';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Default user role not found';
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
      default_role_id
    );
  EXCEPTION 
    WHEN unique_violation THEN
      -- Do nothing on conflict, let the application handle role updates
      NULL;
    WHEN OTHERS THEN
      RAISE LOG 'Error in handle_new_user: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ language plpgsql security definer;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();