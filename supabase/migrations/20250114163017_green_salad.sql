-- Drop existing view if it exists
DROP VIEW IF EXISTS user_profiles;

-- Create a more robust view for user profiles
CREATE OR REPLACE VIEW user_profiles AS
SELECT 
  u.id,
  u.email,
  u.name,
  u.last_name,
  u.id_number,
  u.phone,
  u.address,
  u.birth_date,
  r.name as role
FROM users u
LEFT JOIN roles r ON r.id = u.role_id;

-- Grant access to the view
GRANT SELECT ON user_profiles TO authenticated;

-- Create index to improve view performance
CREATE INDEX IF NOT EXISTS users_role_name_idx ON users(role_id);

-- Update the handle_new_user function to ensure proper user creation
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

  -- Insert the new user
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
    COALESCE(NEW.raw_user_meta_data->>'idNumber', NEW.id),
    default_role_id
  );
  
  RETURN NEW;
END;
$$ language plpgsql security definer;