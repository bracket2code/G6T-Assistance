/*
  # Fix users table and view

  1. Changes
    - Recreate users table with proper structure
    - Create view for users with roles
    - Add RLS policies for users table
*/

-- Drop and recreate users table
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  last_name text NOT NULL,
  dni text UNIQUE NOT NULL,
  phone text,
  address text,
  birth_date date,
  role_id uuid REFERENCES roles(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all authenticated users" ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON users
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON users
  FOR DELETE
  TO authenticated
  USING (true);

-- Create view for users with roles
CREATE OR REPLACE VIEW users_with_roles AS
SELECT 
  u.id,
  u.email,
  u.name,
  u.last_name,
  u.dni,
  u.phone,
  u.address,
  u.birth_date,
  u.created_at,
  r.name as role_name,
  r.description as role_description
FROM users u
LEFT JOIN roles r ON u.role_id = r.id;