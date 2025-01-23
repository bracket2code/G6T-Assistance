/*
  # Fix admin user setup

  1. Changes
    - Ensures admin role exists
    - Updates existing admin user's role
    - Updates handle_new_user function to handle roles correctly
*/

-- First ensure the admin role exists
INSERT INTO roles (name, description)
VALUES ('admin', 'Administrador con acceso completo')
ON CONFLICT (name) DO NOTHING;

-- Update existing admin user's role if they exist
UPDATE users
SET role_id = (SELECT id FROM roles WHERE name = 'admin')
WHERE email = 'admin@admin.com';

-- Update the handle_new_user function to handle roles correctly
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
  END IF;

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
      COALESCE(NEW.raw_user_meta_data->>'idNumber', 'USER-' || NEW.id),
      default_role_id
    );
  EXCEPTION 
    WHEN unique_violation THEN
      UPDATE public.users SET
        email = NEW.email,
        name = COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        last_name = COALESCE(NEW.raw_user_meta_data->>'lastName', ''),
        id_number = COALESCE(NEW.raw_user_meta_data->>'idNumber', 'USER-' || NEW.id),
        role_id = default_role_id
      WHERE id = NEW.id;
  END;
  
  RETURN NEW;
END;
$$ language plpgsql security definer;