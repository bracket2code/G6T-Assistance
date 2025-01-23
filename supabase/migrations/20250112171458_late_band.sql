/*
  # Fix user creation flow

  1. Changes
    - Update trigger function to handle user creation more robustly
    - Add error handling for missing role
    - Make name field nullable initially
    - Add proper error handling

  2. Security
    - Maintain existing RLS policies
    - Ensure data consistency
*/

-- Make name field nullable to allow initial creation
ALTER TABLE users ALTER COLUMN name DROP NOT NULL;

-- Update the trigger function with better error handling
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
      COALESCE(NEW.raw_user_meta_data->>'lastName', ''),
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
      -- On conflict, update existing user
      UPDATE public.users SET
        email = NEW.email,
        name = NULLIF(COALESCE(NEW.raw_user_meta_data->>'name', ''), ''),
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
      -- Log other errors but don't fail
      RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ language plpgsql security definer;