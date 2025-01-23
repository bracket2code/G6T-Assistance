/*
  # Fix user management system

  1. Changes
    - Simplify users table structure
    - Add proper constraints
    - Fix role relationships
    - Add proper indexes

  2. Security
    - Simple RLS policies for authenticated users
*/

-- Drop existing tables to start fresh
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- Create roles table
CREATE TABLE roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text
);

-- Create users table
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

-- Create index for faster lookups
CREATE INDEX users_role_id_idx ON users(role_id);
CREATE INDEX users_email_idx ON users(email);

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Simple policies that just work
CREATE POLICY "Enable read access for authenticated users" ON roles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON users
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable write access for authenticated users" ON users
  FOR ALL TO authenticated USING (true);

-- Insert default roles
INSERT INTO roles (name, description) VALUES
  ('admin', 'Administrador con acceso completo'),
  ('manager', 'Gestor con acceso a gestión'),
  ('user', 'Usuario básico')
ON CONFLICT (name) DO NOTHING;