/*
  # Fix role names and user creation

  1. Changes
    - Update role names to match application
    - Fix user creation trigger
    - Add missing role mappings
*/

-- Update role names to match application expectations
UPDATE roles 
SET name = 'admin' 
WHERE name = 'administrador';

UPDATE roles 
SET name = 'manager' 
WHERE name = 'encargado';

UPDATE roles 
SET name = 'user' 
WHERE name = 'trabajador';

-- Update the trigger function to handle user creation correctly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  BEGIN
    INSERT INTO public.users (
      id,
      email,
      name,
      last_name,
      alias,
      id_type,
      id_number,
      phone,
      address,
      birth_date,
      role_id
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', ''),
      COALESCE(NEW.raw_user_meta_data->>'lastName', ''),
      COALESCE(NEW.raw_user_meta_data->>'alias', ''),
      COALESCE(NEW.raw_user_meta_data->>'idType', 'DNI'),
      COALESCE(NEW.raw_user_meta_data->>'idNumber', NEW.id),
      COALESCE(NEW.raw_user_meta_data->>'phone', ''),
      COALESCE(NEW.raw_user_meta_data->>'address', ''),
      COALESCE(NEW.raw_user_meta_data->>'birthDate', CURRENT_DATE)::date,
      (
        SELECT id 
        FROM public.roles 
        WHERE name = COALESCE(NEW.raw_user_meta_data->>'role', 'user')
        LIMIT 1
      )
    );
  EXCEPTION 
    WHEN unique_violation THEN
      UPDATE public.users SET
        email = NEW.email,
        name = COALESCE(NEW.raw_user_meta_data->>'name', ''),
        last_name = COALESCE(NEW.raw_user_meta_data->>'lastName', ''),
        alias = COALESCE(NEW.raw_user_meta_data->>'alias', ''),
        id_type = COALESCE(NEW.raw_user_meta_data->>'idType', 'DNI'),
        id_number = COALESCE(NEW.raw_user_meta_data->>'idNumber', NEW.id),
        phone = COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        address = COALESCE(NEW.raw_user_meta_data->>'address', ''),
        birth_date = COALESCE(NEW.raw_user_meta_data->>'birthDate', CURRENT_DATE)::date,
        role_id = (
          SELECT id 
          FROM public.roles 
          WHERE name = COALESCE(NEW.raw_user_meta_data->>'role', 'user')
          LIMIT 1
        )
      WHERE id = NEW.id;
  END;
  
  RETURN NEW;
END;
$$ language plpgsql security definer;