/*
  # Fix users schema and data

  1. Changes
    - Add missing columns to users table
    - Update trigger function to handle all fields correctly
    - Fix role handling in trigger function

  2. Security
    - Maintain existing RLS policies
*/

-- Add missing columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS alias text,
ADD COLUMN IF NOT EXISTS id_type text DEFAULT 'DNI',
ADD COLUMN IF NOT EXISTS id_number text;

-- Update trigger function to handle all fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  default_role_id uuid;
BEGIN
  -- Get the default role ID (user)
  SELECT id INTO default_role_id FROM public.roles WHERE name = 'user';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Default role not found';
  END IF;

  BEGIN
    INSERT INTO public.users (
      id,
      email,
      name,
      last_name,
      dni,
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
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
      COALESCE(NEW.raw_user_meta_data->>'lastName', ''),
      COALESCE(NEW.raw_user_meta_data->>'dni', NEW.id),
      COALESCE(NEW.raw_user_meta_data->>'alias', ''),
      COALESCE(NEW.raw_user_meta_data->>'idType', 'DNI'),
      COALESCE(NEW.raw_user_meta_data->>'idNumber', NEW.id),
      NULLIF(COALESCE(NEW.raw_user_meta_data->>'phone', ''), ''),
      NULLIF(COALESCE(NEW.raw_user_meta_data->>'address', ''), ''),
      COALESCE(
        NULLIF(NEW.raw_user_meta_data->>'birthDate', '')::date,
        CURRENT_DATE
      ),
      COALESCE(
        (
          SELECT id 
          FROM public.roles 
          WHERE name = COALESCE(NEW.raw_user_meta_data->>'role', 'user')
          LIMIT 1
        ),
        default_role_id
      )
    );
  EXCEPTION 
    WHEN unique_violation THEN
      UPDATE public.users SET
        email = NEW.email,
        name = COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        last_name = COALESCE(NEW.raw_user_meta_data->>'lastName', ''),
        alias = COALESCE(NEW.raw_user_meta_data->>'alias', ''),
        id_type = COALESCE(NEW.raw_user_meta_data->>'idType', 'DNI'),
        id_number = COALESCE(NEW.raw_user_meta_data->>'idNumber', NEW.id),
        phone = NULLIF(COALESCE(NEW.raw_user_meta_data->>'phone', ''), ''),
        address = NULLIF(COALESCE(NEW.raw_user_meta_data->>'address', ''), ''),
        birth_date = COALESCE(
          NULLIF(NEW.raw_user_meta_data->>'birthDate', '')::date,
          CURRENT_DATE
        ),
        role_id = COALESCE(
          (
            SELECT id 
            FROM public.roles 
            WHERE name = COALESCE(NEW.raw_user_meta_data->>'role', 'user')
            LIMIT 1
          ),
          default_role_id
        )
      WHERE id = NEW.id;
    WHEN OTHERS THEN
      RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ language plpgsql security definer;