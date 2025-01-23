/*
  # Final structure update
  
  1. Changes
    - Recreate users table with consistent structure
    - Update policies
    - Add proper indexes
*/

-- Drop existing tables to start fresh
DROP TABLE IF EXISTS users CASCADE;

-- Create users table with final structure
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  last_name text NOT NULL,
  id_number text UNIQUE,
  phone text,
  address text,
  birth_date date,
  role_id uuid REFERENCES roles(id),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX users_role_id_idx ON users(role_id);
CREATE INDEX users_email_idx ON users(email);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users" ON users
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Enable write access for authenticated users" ON users
  FOR ALL TO authenticated
  USING (true);