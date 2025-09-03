/*
  # Convert to subscription-only model
  
  This migration:
  1. Marks all existing users as having an active subscription (grandfathered in)
  2. Removes trial-specific logic from views
  3. Creates a view that only checks subscription status
  
  For existing users: They get grandfathered in with an active subscription status
  For new users: They must subscribe before accessing the dashboard
*/

-- First, let's grandfather in all existing users by creating subscription records for them
INSERT INTO stripe_subscriptions (
  customer_id,
  subscription_id,
  status,
  price_id,
  current_period_start,
  current_period_end,
  cancel_at_period_end
)
SELECT 
  sc.customer_id,
  'grandfathered_' || sc.customer_id, -- Fake subscription ID for grandfathered users
  'active'::stripe_subscription_status,
  'grandfathered', -- Special price ID for grandfathered users
  EXTRACT(epoch FROM NOW())::bigint,
  EXTRACT(epoch FROM (NOW() + INTERVAL '10 years'))::bigint, -- 10 years from now
  false
FROM stripe_customers sc
LEFT JOIN stripe_subscriptions ss ON sc.customer_id = ss.customer_id
WHERE ss.customer_id IS NULL -- Only for users who don't already have subscriptions
AND sc.deleted_at IS NULL;

-- For users who don't have stripe_customers records yet (auth-only users), 
-- we'll create a special grandfathered status in a new table
CREATE TABLE IF NOT EXISTS grandfathered_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  grandfathered_at timestamptz DEFAULT now(),
  grandfathered_reason text DEFAULT 'Existing user before subscription requirement',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE grandfathered_users ENABLE ROW LEVEL SECURITY;

-- Create unique index on user_id
CREATE UNIQUE INDEX IF NOT EXISTS grandfathered_users_user_id_key ON grandfathered_users(user_id);

-- RLS Policies for grandfathered_users
CREATE POLICY "Users can read own grandfathered status"
  ON grandfathered_users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert all existing auth users as grandfathered (who don't have stripe records)
INSERT INTO grandfathered_users (user_id, grandfathered_reason)
SELECT 
  u.id,
  'Existing user before subscription requirement - grandfathered'
FROM auth.users u
LEFT JOIN stripe_customers sc ON u.id = sc.user_id AND sc.deleted_at IS NULL
WHERE sc.user_id IS NULL -- Users without stripe records
ON CONFLICT (user_id) DO NOTHING;

-- Create new subscription-only access view
CREATE OR REPLACE VIEW user_subscription_access AS
SELECT 
  u.id as user_id,
  u.email,
  -- Check grandfathered status
  CASE 
    WHEN g.user_id IS NOT NULL THEN true
    ELSE false
  END as is_grandfathered,
  -- Subscription information
  s.status as subscription_status,
  s.price_id,
  s.current_period_end,
  -- Check if user has active subscription (including grandfathered)
  CASE 
    WHEN g.user_id IS NOT NULL THEN true  -- Grandfathered users have access
    WHEN s.status = 'active' THEN true
    ELSE false
  END as has_active_subscription,
  -- Overall access type
  CASE 
    WHEN g.user_id IS NOT NULL THEN 'grandfathered'
    WHEN s.status = 'active' THEN 'subscription'
    ELSE 'none'
  END as access_type
FROM auth.users u
LEFT JOIN grandfathered_users g ON u.id = g.user_id
LEFT JOIN stripe_customers sc ON u.id = sc.user_id AND sc.deleted_at IS NULL
LEFT JOIN stripe_subscriptions s ON sc.customer_id = s.customer_id AND s.deleted_at IS NULL;

-- Grant access to the view
GRANT SELECT ON user_subscription_access TO authenticated;

-- Update the existing view to be deprecated (we'll keep it for backward compatibility but it will just redirect to subscription logic)
CREATE OR REPLACE VIEW user_access_status AS
SELECT 
  user_id,
  email,
  NULL::timestamptz as trial_start_date,
  NULL::timestamptz as trial_end_date,
  false as trial_used,
  false as has_active_trial,  -- No more trials
  subscription_status,
  price_id,
  has_active_subscription,
  access_type,
  0 as trial_days_remaining  -- No more trial days
FROM user_subscription_access;
