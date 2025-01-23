/*
  # Update admin user role

  1. Changes
    - Updates the role of admin@admin.com user to admin role
*/

DO $$
DECLARE
  admin_role_id uuid;
  admin_user_id uuid;
BEGIN
  -- Get admin role ID
  SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Admin role not found';
  END IF;

  -- Get admin user ID
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@admin.com';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Admin user not found';
  END IF;

  -- Update admin user role
  UPDATE users 
  SET role_id = admin_role_id
  WHERE id = admin_user_id;
END $$;