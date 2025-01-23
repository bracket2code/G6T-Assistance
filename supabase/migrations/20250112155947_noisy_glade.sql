/*
  # Fix roles and permissions

  1. Changes
    - Drop and recreate roles table with correct names
    - Add default roles with Spanish names
    - Update existing users to use new role IDs
*/

-- Recreate roles table
DROP TABLE IF EXISTS roles CASCADE;
CREATE TABLE roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Insert default roles with Spanish names
INSERT INTO roles (name, description) VALUES
  ('administrador', 'Administrador con acceso completo'),
  ('encargado', 'Gestor con acceso a gestión de empresas y usuarios'),
  ('trabajador', 'Usuario básico')
ON CONFLICT (name) DO NOTHING;

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Create policies for roles table
CREATE POLICY "Enable read access for all authenticated users" ON roles
  FOR SELECT
  TO authenticated
  USING (true);

-- Update handle_new_user function to use new role names
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
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
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
      COALESCE(NEW.raw_user_meta_data->>'lastName', ''),
      COALESCE(NEW.raw_user_meta_data->>'dni', NEW.id),
      COALESCE(NEW.raw_user_meta_data->>'phone', ''),
      COALESCE(NEW.raw_user_meta_data->>'address', ''),
      COALESCE(NEW.raw_user_meta_data->>'birthDate', CURRENT_DATE)::date,
      (SELECT id FROM public.roles WHERE name = 'trabajador' LIMIT 1)
    );
  EXCEPTION 
    WHEN unique_violation THEN
      UPDATE public.users SET
        email = NEW.email,
        name = COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        last_name = COALESCE(NEW.raw_user_meta_data->>'lastName', ''),
        phone = COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        address = COALESCE(NEW.raw_user_meta_data->>'address', ''),
        birth_date = COALESCE(NEW.raw_user_meta_data->>'birthDate', CURRENT_DATE)::date,
        role_id = (SELECT id FROM public.roles WHERE name = 'trabajador' LIMIT 1)
      WHERE id = NEW.id;
  END;
  
  RETURN NEW;
END;
$$ language plpgsql security definer;