/*
  # Add businesses table and initial data

  1. New Tables
    - `businesses`: Stores business information
      - `id`: Primary key (UUID)
      - `commercial_name`: Business commercial name
      - `legal_name`: Legal/fiscal name
      - `address`: Business address
      - `email`: Contact email
      - `tax_id`: CIF/NIF number
      - `notes`: Additional notes
      - `active`: Business status
      - `created_at`: Creation timestamp

  2. Security
    - Enable RLS
    - Add policies for admin and manager access

  3. Initial Data
    - Insert two initial businesses
*/

-- Create businesses table
CREATE TABLE IF NOT EXISTS businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commercial_name text NOT NULL,
  legal_name text NOT NULL,
  address text,
  email text,
  tax_id text UNIQUE,
  notes text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow full access to admins" ON businesses
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Allow full access to managers" ON businesses
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'manager'
  );

CREATE POLICY "Allow read access to users" ON businesses
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('user', 'manager', 'admin')
    AND active = true
  );

-- Insert initial businesses
INSERT INTO businesses (commercial_name, legal_name, address, email, tax_id, notes) VALUES
  (
    'Business 1',
    'Business One SL',
    'Calle Principal 123',
    'business1@example.com',
    'B12345678',
    ''
  ),
  (
    'Business 2',
    'Business Two SL',
    'Avenida Central 456',
    'business2@example.com',
    'B87654321',
    ''
  )
ON CONFLICT DO NOTHING;