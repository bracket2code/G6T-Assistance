/*
  # Add alias field to users table

  1. Changes
    - Add alias column to users table
    - Update handle_new_user function to handle alias field
*/

-- Add alias column to users table
ALTER TABLE users
ADD COLUMN alias text;

-- Update handle_new_user function to include alias
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  default_role_id uuid;
BEGIN
  -- Get default role ID
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
      NULLIF(COALESCE(NEW.raw_user_meta_data->>'name', ''), ''),
      NULLIF(COALESCE(NEW.raw_user_meta_data->>'lastName', ''), ''),
      NULLIF(COALESCE(NEW.raw_user_meta_data->>'alias', ''), ''),
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
        WHEN NEW.email = 'admin@admin.com' THEN 
          (SELECT id FROM roles WHERE name = 'admin')
        ELSE default_role_id
      END
    );
  EXCEPTION 
    WHEN unique_violation THEN
      UPDATE public.users SET
        email = NEW.email,
        name = COALESCE(NULLIF(NEW.raw_user_meta_data->>'name', ''), name),
        last_name = COALESCE(NULLIF(NEW.raw_user_meta_data->>'lastName', ''), last_name),
        alias = COALESCE(NULLIF(NEW.raw_user_meta_data->>'alias', ''), alias),
        id_type = COALESCE(NEW.raw_user_meta_data->>'idType', id_type),
        id_number = COALESCE(NEW.raw_user_meta_data->>'idNumber', id_number),
        phone = NULLIF(COALESCE(NEW.raw_user_meta_data->>'phone', ''), ''),
        address = NULLIF(COALESCE(NEW.raw_user_meta_data->>'address', ''), ''),
        birth_date = CASE 
          WHEN NEW.raw_user_meta_data->>'birthDate' IS NULL OR NEW.raw_user_meta_data->>'birthDate' = ''
          THEN birth_date
          ELSE (NEW.raw_user_meta_data->>'birthDate')::date
        END,
        role_id = CASE
          WHEN NEW.email = 'admin@admin.com' THEN 
            (SELECT id FROM roles WHERE name = 'admin')
          ELSE role_id
        END
      WHERE id = NEW.id;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;