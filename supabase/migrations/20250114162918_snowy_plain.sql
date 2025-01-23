/*
  # Update schema and add user profiles view
  
  1. Changes
    - Rename commercial_name to name in businesses table
    - Create regular view for user profiles
    - Add function for user profile access control
  
  2. Security
    - Use function-based security for view access
*/

-- Update businesses table
ALTER TABLE businesses 
  RENAME COLUMN commercial_name TO name;

-- Create function to check if user is authenticated
CREATE OR REPLACE FUNCTION auth.is_authenticated()
RETURNS boolean AS $$
BEGIN
  RETURN (auth.role() = 'authenticated');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view with row-level security built into the view definition
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
LEFT JOIN roles r ON r.id = u.role_id
WHERE auth.is_authenticated();

-- Grant access to the view
GRANT SELECT ON user_profiles TO authenticated;

-- Create index on users table to improve view performance
CREATE INDEX IF NOT EXISTS users_role_name_idx ON users(role_id);