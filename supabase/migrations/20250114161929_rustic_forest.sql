/*
  # Fix User Schema and Policies

  1. Changes
    - Drop and recreate users table with proper structure
    - Add proper foreign key constraints
    - Update RLS policies
    - Add trigger for auth user creation

  2. Security
    - Enable RLS
    - Add policies for proper data access
*/

-- Drop existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop existing table
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text UNIQUE NOT NULL,
  name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  id_number text UNIQUE,
  phone text,
  address text,
  birth_date date,
  role_id uuid REFERENCES roles(id),
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX users_role_id_idx ON users(role_id);
CREATE INDEX users_email_idx ON users(email);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all profiles"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin can manage all profiles"
  ON users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      INNER JOIN roles r ON r.id = u.role_id
      WHERE u.id = auth.uid() AND r.name = 'admin'
    )
  );

-- Create trigger function for new users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    name,
    last_name,
    id_number,
    role_id
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'lastName', ''),
    COALESCE(NEW.raw_user_meta_data->>'idNumber', NEW.id),
    (SELECT id FROM roles WHERE name = 'user')
  );
  RETURN NEW;
END;
$$ language plpgsql security definer;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();