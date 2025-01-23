/*
  # Fix user role query

  1. New Views
    - Create users_with_roles view for easier role access
  
  2. Changes
    - Add view that joins users with roles
    - Update policies to allow access to the view
*/

-- Create view for users with roles
CREATE OR REPLACE VIEW users_with_roles AS
SELECT 
  u.id,
  u.email,
  u.name,
  u.last_name,
  u.id_type,
  u.id_number,
  u.phone,
  u.address,
  u.birth_date,
  u.created_at,
  r.name as role_name,
  r.description as role_description
FROM users u
LEFT JOIN roles r ON u.role_id = r.id;

-- Grant access to the view
GRANT SELECT ON users_with_roles TO authenticated;