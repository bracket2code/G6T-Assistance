/*
  # Fix user creation with proper role handling

  1. Changes
    - Add function to get role ID by name
    - Update user creation to use role IDs properly
    - Add error handling for role assignment

  2. Security
    - Maintain existing RLS policies
    - Ensure proper role validation
*/

-- Create function to get role ID by name
CREATE OR REPLACE FUNCTION get_role_id(role_name text)
RETURNS uuid AS $$
DECLARE
  role_id uuid;
BEGIN
  SELECT id INTO role_id FROM roles WHERE name = role_name;
  IF NOT FOUND THEN
    -- If role doesn't exist, default to 'user' role
    SELECT id INTO role_id FROM roles WHERE name = 'user';
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Default user role not found';
    END IF;
  END IF;
  RETURN role_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update handle_new_user function to use role IDs properly
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_role_id uuid;
BEGIN
  -- Get role ID based on metadata or default to 'user'
  IF NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
    user_role_id := get_role_id(NEW.raw_user_meta_data->>'role');
  ELSE
    -- Special case for admin@admin.com
    IF NEW.email = 'admin@admin.com' THEN
      user_role_id := get_role_id('admin');
    ELSE
      user_role_id := get_role_id('user');
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
      COALESCE(NEW.raw_user_meta_data->>'idNumber', NEW.id),
      NULLIF(COALESCE(NEW.raw_user_meta_data->>'phone', ''), ''),
      NULLIF(COALESCE(NEW.raw_user_meta_data->>'address', ''), ''),
      CASE 
        WHEN NEW.raw_user_meta_data->>'birthDate' IS NULL OR NEW.raw_user_meta_data->>'birthDate' = ''
        THEN NULL
        ELSE (NEW.raw_user_meta_data->>'birthDate')::date
      END,
      user_role_id
    );
  EXCEPTION 
    WHEN unique_violation THEN
      -- On conflict, update the existing user
      UPDATE public.users SET
        email = NEW.email,
        name = COALESCE(NEW.raw_user_meta_data->>'name', name),
        last_name = COALESCE(NEW.raw_user_meta_data->>'lastName', last_name),
        id_type = COALESCE(NEW.raw_user_meta_data->>'idType', id_type),
        id_number = COALESCE(NEW.raw_user_meta_data->>'idNumber', id_number),
        phone = NULLIF(COALESCE(NEW.raw_user_meta_data->>'phone', ''), ''),
        address = NULLIF(COALESCE(NEW.raw_user_meta_data->>'address', ''), ''),
        birth_date = CASE 
          WHEN NEW.raw_user_meta_data->>'birthDate' IS NULL OR NEW.raw_user_meta_data->>'birthDate' = ''
          THEN birth_date
          ELSE (NEW.raw_user_meta_data->>'birthDate')::date
        END,
        role_id = user_role_id
      WHERE id = NEW.id;
    WHEN OTHERS THEN
      RAISE LOG 'Error in handle_new_user: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();