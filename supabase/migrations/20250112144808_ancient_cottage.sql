/*
  # Fix authentication and policies
  
  1. Changes
    - Drop existing policies
    - Create new RLS policies for authenticated users
    - Create trigger to auto-create users
  
  2. Security
    - Enable RLS policies for authenticated users
    - Ensure proper user creation on auth signup
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow full access to admins" ON users;
DROP POLICY IF EXISTS "Allow full access to managers" ON users;
DROP POLICY IF EXISTS "Allow read access to users" ON users;

-- Create auth schema policies
CREATE POLICY "Enable read access for all authenticated users" ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON users
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON users
  FOR DELETE
  TO authenticated
  USING (true);

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  admin_role_id uuid;
BEGIN
  -- Get admin role ID
  SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';
  
  -- Insert a new user record
  INSERT INTO public.users (
    id,
    email,
    name,
    last_name,
    dni,
    phone,
    address,
    birth_date,
    role_id
  ) VALUES (
    NEW.id,
    NEW.email,
    'Admin',
    'User',
    '12345678A',
    '123456789',
    'Admin Address',
    '1990-01-01',
    admin_role_id
  );
  
  RETURN NEW;
END;
$$ language plpgsql security definer;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();