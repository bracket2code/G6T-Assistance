/*
  # Fix user creation trigger

  1. Changes
    - Drop and recreate user creation trigger with proper error handling
    - Add proper permissions for auth schema
    - Ensure unique constraint handling

  2. Security
    - Maintain existing RLS policies
    - Keep security definer for function
*/

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO postgres, authenticated, anon;
GRANT SELECT ON auth.users TO postgres, authenticated, anon;

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function to handle new user creation with error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert new user record with error handling
  BEGIN
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
      COALESCE(NEW.raw_user_meta_data->>'dni', '12345678A' || NEW.id),
      COALESCE(NEW.raw_user_meta_data->>'phone', '123456789'),
      COALESCE(NEW.raw_user_meta_data->>'address', 'Admin Address'),
      COALESCE(NEW.raw_user_meta_data->>'birthDate', '1990-01-01')::date,
      (SELECT id FROM public.roles WHERE name = 'admin' LIMIT 1)
    );
  EXCEPTION 
    WHEN unique_violation THEN
      -- If there's a unique violation, update the existing record
      UPDATE public.users SET
        email = NEW.email,
        name = COALESCE(NEW.raw_user_meta_data->>'name', 'Admin'),
        last_name = COALESCE(NEW.raw_user_meta_data->>'lastName', 'User'),
        phone = COALESCE(NEW.raw_user_meta_data->>'phone', '123456789'),
        address = COALESCE(NEW.raw_user_meta_data->>'address', 'Admin Address'),
        birth_date = COALESCE(NEW.raw_user_meta_data->>'birthDate', '1990-01-01')::date,
        role_id = (SELECT id FROM public.roles WHERE name = 'admin' LIMIT 1)
      WHERE id = NEW.id;
  END;
  
  RETURN NEW;
END;
$$ language plpgsql security definer;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();