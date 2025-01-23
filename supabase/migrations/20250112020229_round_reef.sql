/*
  # Fix Business RLS Policies

  1. Changes
    - Drop existing policies for businesses table
    - Add new policies for proper access control
    - Allow authenticated users to manage businesses
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow full access to admins" ON businesses;
DROP POLICY IF EXISTS "Allow full access to managers" ON businesses;
DROP POLICY IF EXISTS "Allow read access to users" ON businesses;

-- Create new policies
CREATE POLICY "Enable read access for all authenticated users" ON businesses
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users" ON businesses
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON businesses
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON businesses
  FOR DELETE
  TO authenticated
  USING (true);