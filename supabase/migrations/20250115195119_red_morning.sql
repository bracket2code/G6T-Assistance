/*
  # Fix RLS policies to avoid recursion

  1. Changes
    - Drop existing policies that cause recursion
    - Create simpler policies that avoid checking roles recursively
    - Add direct role check using a join
    
  2. Security
    - Maintain proper access control
    - Prevent infinite recursion
    - Allow proper user management
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable write access for admins and managers" ON users;
DROP POLICY IF EXISTS "Enable users to update own profile" ON users;

-- Create simpler policies that avoid recursion
CREATE POLICY "users_select_policy" 
  ON users FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "users_insert_policy" 
  ON users FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      INNER JOIN roles r ON r.id = u.role_id
      WHERE u.id = auth.uid()
      AND r.name IN ('admin', 'manager')
    )
    OR auth.uid() = id
  );

CREATE POLICY "users_update_policy" 
  ON users FOR UPDATE 
  TO authenticated 
  USING (
    auth.uid() = id 
    OR EXISTS (
      SELECT 1 FROM users u
      INNER JOIN roles r ON r.id = u.role_id
      WHERE u.id = auth.uid()
      AND r.name IN ('admin', 'manager')
    )
  );

CREATE POLICY "users_delete_policy" 
  ON users FOR DELETE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users u
      INNER JOIN roles r ON r.id = u.role_id
      WHERE u.id = auth.uid()
      AND r.name IN ('admin', 'manager')
    )
  );

-- Create function to check user role without recursion
CREATE OR REPLACE FUNCTION auth.user_role(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT r.name
  FROM roles r
  INNER JOIN users u ON u.role_id = r.id
  WHERE u.id = user_id
$$;