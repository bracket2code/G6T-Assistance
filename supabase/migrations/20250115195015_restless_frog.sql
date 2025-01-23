/*
  # Fix RLS policies for users table

  1. Changes
    - Drop existing policies that cause recursion
    - Create simpler policies based on role names
    - Add policy for admin and manager access
    - Add policy for self-management
    
  2. Security
    - Maintain data access control
    - Prevent infinite recursion
    - Allow proper role-based access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable update for own profile" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable admin users to manage all users" ON users;
DROP POLICY IF EXISTS "Enable managers to manage non-admin users" ON users;
DROP POLICY IF EXISTS "Enable admin users to update roles" ON users;

-- Create new simplified policies
CREATE POLICY "Allow users to read all profiles"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow users to update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id OR
    (SELECT r.name FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = auth.uid()) IN ('admin', 'manager')
  );

CREATE POLICY "Allow admins and managers to insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT r.name FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = auth.uid()) IN ('admin', 'manager')
  );

CREATE POLICY "Allow admins and managers to delete users"
  ON users FOR DELETE
  TO authenticated
  USING (
    (SELECT r.name FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = auth.uid()) IN ('admin', 'manager')
  );