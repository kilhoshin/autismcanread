-- Run this in Supabase SQL Editor
-- Add Stripe integration columns to users table

-- Add Stripe customer ID column
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id text;

-- Add Stripe subscription ID column  
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

-- Add unique constraint on stripe_customer_id to prevent duplicate customers
ALTER TABLE users ADD CONSTRAINT users_stripe_customer_id_unique 
  UNIQUE (stripe_customer_id);

-- Add unique constraint on stripe_subscription_id to prevent duplicate subscriptions
ALTER TABLE users ADD CONSTRAINT users_stripe_subscription_id_unique 
  UNIQUE (stripe_subscription_id);

-- Add indexes for better performance on Stripe queries
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription_id ON users(stripe_subscription_id);

-- Add comments for documentation
COMMENT ON COLUMN users.stripe_customer_id IS 'Stripe customer ID for payment processing';
COMMENT ON COLUMN users.stripe_subscription_id IS 'Stripe subscription ID for recurring payments';
