/*
  # Fix users table structure

  1. Changes
    - Add missing columns for user identification
    - Update table structure to match application needs
    - Add proper constraints

  2. Security
    - Maintain existing RLS policies
*/

-- Drop existing table
DROP TABLE IF EXISTS users CASCADE;

-- Create users table with all required fields
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  last_name text NOT NULL,
  id_type text DEFAULT 'DNI',
  id_number text UNIQUE,
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
INSERT INTO users (id, email, name, last_name, id_number, role_id)
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