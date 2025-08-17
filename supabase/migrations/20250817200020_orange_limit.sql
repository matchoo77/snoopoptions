/*
  # Add user trial system

  1. New Tables
    - `user_trials`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `trial_start_date` (timestamp)
      - `trial_end_date` (timestamp)
      - `trial_used` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `user_trials` table
    - Add policy for users to read their own trial data
    - Add policy for users to insert their own trial data

  3. Functions
    - Function to automatically create trial when user signs up
    - Function to check if user has active trial or subscription
*/

-- Create user_trials table
CREATE TABLE IF NOT EXISTS user_trials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trial_start_date timestamptz NOT NULL DEFAULT now(),
  trial_end_date timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  trial_used boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_trials ENABLE ROW LEVEL SECURITY;

-- Create unique index on user_id to ensure one trial per user
CREATE UNIQUE INDEX IF NOT EXISTS user_trials_user_id_key ON user_trials(user_id);

-- RLS Policies
CREATE POLICY "Users can read own trial data"
  ON user_trials
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trial data"
  ON user_trials
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trial data"
  ON user_trials
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to create trial for new users
CREATE OR REPLACE FUNCTION create_user_trial()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_trials (user_id, trial_used)
  VALUES (NEW.id, false)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create trial when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_trial();

-- Create view for user access status
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
  -- Days remaining in trial
  CASE 
    WHEN t.trial_end_date > now() AND NOT t.trial_used THEN 
      EXTRACT(days FROM (t.trial_end_date - now()))::integer
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