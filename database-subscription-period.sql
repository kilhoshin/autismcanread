-- Add subscription period tracking to users table
-- Run this in Supabase SQL Editor

-- Add subscription period end date column
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_period_end timestamptz;

-- Add check constraint to allow 'cancelled' status
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_subscription_status_check;
ALTER TABLE users ADD CONSTRAINT users_subscription_status_check 
  CHECK (subscription_status IN ('free', 'premium', 'cancelled'));

-- Add index for better performance on subscription period queries
CREATE INDEX IF NOT EXISTS idx_users_subscription_period_end ON users(subscription_period_end);

-- Update the subscription status constraint to include 'cancelled'
COMMENT ON COLUMN users.subscription_period_end IS 'End date of current subscription period. Used to allow cancelled subscriptions to maintain premium access until period ends.';
