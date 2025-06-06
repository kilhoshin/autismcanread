-- Add is_active column to users table for account deactivation
-- This migration adds support for soft deletion of user accounts

-- Add is_active column with default value true
ALTER TABLE users 
ADD COLUMN is_active BOOLEAN DEFAULT true NOT NULL;

-- Add comment to explain the column purpose
COMMENT ON COLUMN users.is_active IS 'Indicates if the user account is active. Set to false for soft deletion.';

-- Create index for better query performance on active users
CREATE INDEX idx_users_is_active ON users(is_active);

-- Update any existing users to be active by default (should already be true due to DEFAULT)
UPDATE users SET is_active = true WHERE is_active IS NULL;

-- Example queries for reference:

-- Find all active users:
-- SELECT * FROM users WHERE is_active = true;

-- Find all deactivated users:
-- SELECT * FROM users WHERE is_active = false;

-- Deactivate a user account:
-- UPDATE users SET is_active = false, updated_at = NOW() WHERE id = 'user_id_here';

-- Reactivate a user account:
-- UPDATE users SET is_active = true, updated_at = NOW() WHERE id = 'user_id_here';
