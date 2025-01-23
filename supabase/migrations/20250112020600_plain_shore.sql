/*
  # Create admin user

  1. Changes
    - Create admin user with email admin@admin.com and password 123
    - Assign admin role to the user
*/

-- Get admin role ID
DO $$
DECLARE
  admin_role_id uuid;
BEGIN
  SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';

  -- Create admin user
  INSERT INTO users (
    email,
    name,
    last_name,
    dni,
    phone,
    address,
    birth_date,
    role_id
  ) VALUES (
    'admin@admin.com',
    'Admin',
    'User',
    '12345678A',
    '123456789',
    'Admin Address',
    '1990-01-01',
    admin_role_id
  );
END $$;