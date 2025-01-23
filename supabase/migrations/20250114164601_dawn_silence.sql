-- Drop existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Update the handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  default_role_id uuid;
BEGIN
  -- Get the default role ID (user)
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
      id_number,
      role_id
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'lastName', ''),
      COALESCE(NEW.raw_user_meta_data->>'idNumber', 'USER-' || NEW.id::text),
      default_role_id
    );
  EXCEPTION 
    WHEN unique_violation THEN
      -- If user already exists, update their information
      UPDATE public.users SET
        email = NEW.email,
        name = COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        last_name = COALESCE(NEW.raw_user_meta_data->>'lastName', ''),
        id_number = COALESCE(NEW.raw_user_meta_data->>'idNumber', 'USER-' || NEW.id::text)
      WHERE id = NEW.id;
    WHEN OTHERS THEN
      RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ language plpgsql security definer;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create index for faster role lookups
CREATE INDEX IF NOT EXISTS roles_name_idx ON roles(name);

-- Ensure all existing auth users have corresponding user records
INSERT INTO public.users (id, email, name, last_name, id_number, role_id)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
  COALESCE(au.raw_user_meta_data->>'lastName', ''),
  COALESCE(au.raw_user_meta_data->>'idNumber', 'USER-' || au.id::text),
  (SELECT id FROM roles WHERE name = 'user')
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = au.id);