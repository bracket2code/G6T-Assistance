/*
  # Add theme preferences to users table

  1. Changes
    - Add theme_preference column to users table
    - Set default theme preference to 'system'
    - Add check constraint for valid theme values

  2. Notes
    - Valid theme values are: 'system', 'light', 'dark'
    - Existing users will default to 'system'
*/

-- Add theme_preference column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS theme_preference text 
DEFAULT 'system' 
CHECK (theme_preference IN ('system', 'light', 'dark'));