/*
  # Add ID type column to users table

  1. Changes
    - Add id_type column to users table
    - Update existing records to use 'DNI' as default
    - Add check constraint for valid id types
*/

-- Add id_type column with default value
ALTER TABLE users 
ADD COLUMN id_type text DEFAULT 'DNI' NOT NULL;

-- Add check constraint for valid id types
ALTER TABLE users 
ADD CONSTRAINT users_id_type_check 
CHECK (id_type IN ('DNI', 'NIE', 'Pasaporte', 'Otros'));

-- Update existing records to use 'DNI' as default
UPDATE users SET id_type = 'DNI' WHERE id_type IS NULL;

-- Update handle_new_user function to include id_type
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  default_role_id uuid;
BEGIN
  -- Get the default role ID (user)
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
      id_type,
      id_number,
      role_id
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'lastName', ''),
      COALESCE(NEW.raw_user_meta_data->>'idType', 'DNI'),
      COALESCE(NEW.raw_user_meta_data->>'idNumber', 'USER-' || NEW.id),
      default_role_id
    );
  EXCEPTION 
    WHEN unique_violation THEN
      UPDATE public.users SET
        email = NEW.email,
        name = COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        last_name = COALESCE(NEW.raw_user_meta_data->>'lastName', ''),
        id_type = COALESCE(NEW.raw_user_meta_data->>'idType', 'DNI'),
        id_number = COALESCE(NEW.raw_user_meta_data->>'idNumber', 'USER-' || NEW.id),
        role_id = default_role_id
      WHERE id = NEW.id;
  END;
  
  RETURN NEW;
END;
$$ language plpgsql security definer;