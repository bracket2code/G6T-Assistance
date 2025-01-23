/*
  # Fix auth trigger permissions

  1. Changes
    - Grant usage on auth schema
    - Grant select on auth.users
    - Re-create trigger with proper permissions
*/

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO postgres;
GRANT SELECT ON auth.users TO postgres;

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

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
    COALESCE(NEW.raw_user_meta_data->>'name', 'Admin'),
    COALESCE(NEW.raw_user_meta_data->>'lastName', 'User'),
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
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();