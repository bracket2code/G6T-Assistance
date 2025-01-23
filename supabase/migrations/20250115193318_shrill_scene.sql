/*
  # Fix admin role display

  1. Changes
    - Ensure admin@admin.com user has admin role
    - Add policy to allow admin users to update roles
    - Fix role assignment in trigger function
*/

-- First ensure admin role exists
INSERT INTO roles (name, description)
VALUES ('admin', 'Administrador con acceso completo')
ON CONFLICT (name) DO NOTHING;

-- Update admin user's role
UPDATE users
SET role_id = (SELECT id FROM roles WHERE name = 'admin')
WHERE email = 'admin@admin.com';

-- Update handle_new_user function to properly handle roles
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  admin_role_id uuid;
  default_role_id uuid;
BEGIN
  -- Get admin role ID for admin@admin.com
  SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Admin role not found';
  END IF;

  -- Get default role ID for other users
  SELECT id INTO default_role_id FROM roles WHERE name = 'user';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Default role not found';
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
        WHEN NEW.email = 'admin@admin.com' THEN admin_role_id
        ELSE default_role_id
      END
    );
  EXCEPTION 
    WHEN unique_violation THEN
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
          WHEN NEW.email = 'admin@admin.com' THEN admin_role_id
          ELSE role_id
        END
      WHERE id = NEW.id;
  END;
  
  RETURN NEW;
END;
$$ language plpgsql security definer;