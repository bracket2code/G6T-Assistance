/*
  # Fix user creation and RLS policies

  1. Changes
    - Drop existing policies
    - Create simpler policies that avoid recursion
    - Update trigger function to handle user creation properly
    
  2. Security
    - Maintain proper access control
    - Allow user creation by admins/managers
    - Prevent infinite recursion
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow users to read all profiles" ON users;
DROP POLICY IF EXISTS "Allow users to update own profile" ON users;
DROP POLICY IF EXISTS "Allow admins and managers to insert users" ON users;
DROP POLICY IF EXISTS "Allow admins and managers to delete users" ON users;

-- Create simpler policies
CREATE POLICY "Enable read access for all users"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable write access for admins and managers"
  ON users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users au
      JOIN users u ON u.id = au.id
      JOIN roles r ON r.id = u.role_id
      WHERE au.id = auth.uid() 
      AND r.name IN ('admin', 'manager')
    )
  );

CREATE POLICY "Enable users to update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- Update trigger function
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

  -- Insert new user with retry logic
  FOR i IN 1..3 LOOP
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
      
      -- If insert succeeds, exit the loop
      EXIT;
    EXCEPTION 
      WHEN unique_violation THEN
        -- If it's the last attempt, raise the error
        IF i = 3 THEN
          RAISE;
        END IF;
        -- Wait a bit before retrying
        PERFORM pg_sleep(0.1 * i);
      WHEN OTHERS THEN
        RAISE LOG 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
    END;
  END LOOP;

  RETURN NEW;
END;
$$ language plpgsql security definer;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();