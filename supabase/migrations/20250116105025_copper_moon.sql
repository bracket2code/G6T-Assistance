/*
  # Add user-business assignments

  1. New Tables
    - `user_businesses`: Links users with their assigned businesses
      - `user_id` (uuid, references users.id)
      - `business_id` (uuid, references businesses.id)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for admins and managers
*/

-- Create user_businesses table
CREATE TABLE user_businesses (
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, business_id)
);

-- Enable RLS
ALTER TABLE user_businesses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users"
  ON user_businesses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable write access for admins and managers"
  ON user_businesses FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE u.id = auth.uid()
      AND r.name IN ('admin', 'manager')
    )
  );

-- Add default assignments for admin users
INSERT INTO user_businesses (user_id, business_id)
SELECT u.id, b.id
FROM users u
CROSS JOIN businesses b
WHERE EXISTS (
  SELECT 1 FROM roles r
  WHERE r.id = u.role_id
  AND r.name = 'admin'
);