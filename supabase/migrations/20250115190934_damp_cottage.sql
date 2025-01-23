/*
  # Fix user creation trigger

  1. Changes
    - Simplify user creation trigger
    - Add better error handling
    - Fix role assignment
    - Ensure proper id_type and id_number handling

  2. Security
    - Maintain existing RLS policies
*/

-- Drop existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create improved trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  default_role_id uuid;
BEGIN
  -- Get the role ID based on metadata or default to 'user'
  SELECT id INTO default_role_id 
  FROM roles 
  WHERE name = COALESCE(NEW.raw_user_meta_data->>'role', 'user');
  
  IF NOT FOUND THEN
    SELECT id INTO default_role_id FROM roles WHERE name = 'user';
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Default user role not found';
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
      COALESCE(NEW.raw_user_meta_data->>'name', ''),
      COALESCE(NEW.raw_user_meta_data->>'lastName', ''),
      COALESCE(NEW.raw_user_meta_data->>'idType', 'DNI'),
      COALESCE(NEW.raw_user_meta_data->>'idNumber', ''),
      COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
      COALESCE(NEW.raw_user_meta_data->>'address', NULL),
      NULLIF(COALESCE(NEW.raw_user_meta_data->>'birthDate', ''), '')::date,
      default_role_id
    );
  EXCEPTION 
    WHEN unique_violation THEN
      UPDATE public.users SET
        email = NEW.email,
        name = COALESCE(NEW.raw_user_meta_data->>'name', name),
        last_name = COALESCE(NEW.raw_user_meta_data->>'lastName', last_name),
        id_type = COALESCE(NEW.raw_user_meta_data->>'idType', id_type),
        id_number = COALESCE(NEW.raw_user_meta_data->>'idNumber', id_number),
        phone = COALESCE(NEW.raw_user_meta_data->>'phone', phone),
        address = COALESCE(NEW.raw_user_meta_data->>'address', address),
        birth_date = NULLIF(COALESCE(NEW.raw_user_meta_data->>'birthDate', ''), '')::date,
        role_id = default_role_id
      WHERE id = NEW.id;
    WHEN OTHERS THEN
      RAISE LOG 'Error in handle_new_user: %', SQLERRM;
      RETURN NEW;
  END;
  
  RETURN NEW;
END;
$$ language plpgsql security definer;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();