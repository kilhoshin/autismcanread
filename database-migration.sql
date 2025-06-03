-- Add subscription and monthly usage tracking columns to users table
-- Run this in Supabase SQL Editor

-- Add subscription status column
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'free';

-- Add monthly worksheet generation tracking columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_worksheets_generated integer DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_generation_month integer;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_generation_year integer;

-- Add index for better performance on subscription queries
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);

-- Update existing users to have free subscription status
UPDATE users SET subscription_status = 'free' WHERE subscription_status IS NULL;
