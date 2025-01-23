-- Add show_welcome_splash column to users table
ALTER TABLE users ADD COLUMN show_welcome_splash boolean DEFAULT true;