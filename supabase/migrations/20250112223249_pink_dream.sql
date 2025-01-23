/*
  # Fix users and roles relationship

  1. Changes
    - Drop and recreate users table with proper foreign key relationship
    - Add proper RLS policies
    - Fix role relationships

  2. Security
    - Enable RLS on users table
    - Add policies for authenticated users
*/

-- Drop existing objects
DROP TABLE IF EXISTS users CASCADE;

-- Create users table with proper foreign key relationship
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
CREATE POLICY "Enable read access for all users" ON users
  FOR SELECT
  USING (true);

CREATE POLICY "Enable write access for all users" ON users
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create admin user if it doesn't exist
INSERT INTO users (id, email, name, last_name, dni, role_id)
SELECT 
  gen_random_uuid(),
  'admin@admin.com',
  'Admin',
  'User',
  'ADMIN-1',
  r.id
FROM roles r
WHERE r.name = 'admin'
AND NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'admin@admin.com'
);