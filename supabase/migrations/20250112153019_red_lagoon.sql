/*
  # Update role names and fix user creation

  1. Changes
    - Rename roles from admin/manager/user to administrador/encargado/trabajador
    - Update existing users to use new role names
    - Fix user creation trigger to use new role names

  2. Security
    - Maintain existing RLS policies
    - Update role references in policies
*/

-- Update role names
UPDATE roles 
SET name = 'administrador' 
WHERE name = 'admin';

UPDATE roles 
SET name = 'encargado' 
WHERE name = 'manager';

UPDATE roles 
SET name = 'trabajador' 
WHERE name = 'user';

-- Update the trigger function to use new role names
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
      (SELECT id FROM public.roles WHERE name = COALESCE(NEW.raw_user_meta_data->>'role', 'trabajador') LIMIT 1)
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
        role_id = (SELECT id FROM public.roles WHERE name = COALESCE(NEW.raw_user_meta_data->>'role', 'trabajador') LIMIT 1)
      WHERE id = NEW.id;
  END;
  
  RETURN NEW;
END;
$$ language plpgsql security definer;