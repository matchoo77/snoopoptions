/*
  # Update user_access_status view to include trial_start_date

  This migration updates the user_access_status view to include the trial_start_date
  for proper countdown calculation from account creation.
*/

-- Drop and recreate the view to include trial_start_date
DROP VIEW IF EXISTS user_access_status;

CREATE OR REPLACE VIEW user_access_status AS
SELECT 
  u.id as user_id,
  u.email,
  -- Trial information
  t.trial_start_date,
  t.trial_end_date,
  t.trial_used,
  CASE 
    WHEN t.trial_end_date > now() AND NOT t.trial_used THEN true
    ELSE false
  END as has_active_trial,
  -- Subscription information
  s.subscription_status,
  s.price_id,
  CASE 
    WHEN s.subscription_status = 'active' THEN true
    ELSE false
  END as has_active_subscription,
  -- Overall access
  CASE 
    WHEN s.subscription_status = 'active' THEN 'subscription'
    WHEN t.trial_end_date > now() AND NOT t.trial_used THEN 'trial'
    ELSE 'expired'
  END as access_type,
  -- Days remaining in trial (more precise calculation)
  CASE 
    WHEN t.trial_end_date > now() AND NOT t.trial_used THEN 
      CEIL(EXTRACT(epoch FROM (t.trial_end_date - now())) / (24 * 60 * 60))::integer
    ELSE 0
  END as trial_days_remaining
FROM auth.users u
LEFT JOIN user_trials t ON u.id = t.user_id
LEFT JOIN stripe_user_subscriptions s ON u.id = (
  SELECT sc.user_id 
  FROM stripe_customers sc 
  WHERE sc.customer_id = s.customer_id 
  AND sc.deleted_at IS NULL
);

-- Grant access to the view
GRANT SELECT ON user_access_status TO authenticated;
