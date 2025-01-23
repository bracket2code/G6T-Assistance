/*
  # Fix user authentication and profile handling

  1. Changes
    - Drop user_profiles view if exists
    - Update users table structure
    - Add proper indexes and constraints
    - Update trigger function
*/

-- Drop view if exists
DROP VIEW IF EXISTS user_profiles;

-- Drop existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

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

-- Create policies
CREATE POLICY "Enable read access for authenticated users"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable update for own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

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
      CASE
        WHEN NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
          (SELECT id FROM roles WHERE name = NEW.raw_user_meta_data->>'role')
        ELSE default_role_id
      END
    );
  EXCEPTION 
    WHEN unique_violation THEN
      -- Update existing user
      UPDATE public.users SET
        email = NEW.email,
        name = COALESCE(NULLIF(NEW.raw_user_meta_data->>'name', ''), name),
        last_name = COALESCE(NULLIF(NEW.raw_user_meta_data->>'lastName', ''), last_name),
        id_type = COALESCE(NEW.raw_user_meta_data->>'idType', id_type),
        id_number = COALESCE(NEW.raw_user_meta_data->>'idNumber', id_number),
        phone = COALESCE(NULLIF(NEW.raw_user_meta_data->>'phone', ''), phone),
        address = COALESCE(NULLIF(NEW.raw_user_meta_data->>'address', ''), address),
        birth_date = CASE 
          WHEN NEW.raw_user_meta_data->>'birthDate' IS NULL OR NEW.raw_user_meta_data->>'birthDate' = ''
          THEN birth_date
          ELSE (NEW.raw_user_meta_data->>'birthDate')::date
        END,
        role_id = CASE
          WHEN NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
            (SELECT id FROM roles WHERE name = NEW.raw_user_meta_data->>'role')
          ELSE role_id
        END
      WHERE id = NEW.id;
    WHEN OTHERS THEN
      RAISE LOG 'Error in handle_new_user: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ language plpgsql security definer;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();