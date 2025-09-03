/*
  # SnoopTest Backend Tables

  1. New Tables
    - `options_sweeps`
      - `id` (uuid, primary key)
      - `ticker` (text)
      - `trade_date` (date)
      - `option_type` (enum: call, put)
      - `strike_price` (numeric)
      - `expiration_date` (date)
      - `volume` (integer)
      - `price` (numeric)
      - `bid` (numeric)
      - `ask` (numeric)
      - `trade_location` (enum)
      - `inferred_side` (enum)
      - `premium` (numeric)
      - `created_at` (timestamp)

    - `user_alerts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `ticker` (text)
      - `trade_locations` (text array)
      - `min_win_rate` (numeric)
      - `notification_type` (enum)
      - `is_active` (boolean)
      - `created_at` (timestamp)

    - `snooptest_results`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `ticker` (text)
      - `start_date` (date)
      - `end_date` (date)
      - `hold_period` (integer)
      - `trade_locations` (text array)
      - `total_sweeps` (integer)
      - `win_rate` (numeric)
      - `average_move` (numeric)
      - `results_data` (jsonb)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data

  3. Enums
    - Create enums for option_type, trade_location, inferred_side, notification_type
*/

-- Create enums
CREATE TYPE IF NOT EXISTS option_type AS ENUM ('call', 'put');
CREATE TYPE IF NOT EXISTS trade_location AS ENUM ('below_bid', 'at_bid', 'midpoint', 'at_ask', 'above_ask');
CREATE TYPE IF NOT EXISTS inferred_side AS ENUM ('buy', 'sell', 'neutral');
CREATE TYPE IF NOT EXISTS notification_type AS ENUM ('email', 'browser');

-- Create options_sweeps table
CREATE TABLE IF NOT EXISTS options_sweeps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker text NOT NULL,
  trade_date date NOT NULL,
  option_type option_type NOT NULL,
  strike_price numeric NOT NULL,
  expiration_date date NOT NULL,
  volume integer NOT NULL,
  price numeric NOT NULL,
  bid numeric NOT NULL,
  ask numeric NOT NULL,
  trade_location trade_location NOT NULL,
  inferred_side inferred_side NOT NULL,
  premium numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create user_alerts table
CREATE TABLE IF NOT EXISTS user_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticker text NOT NULL,
  trade_locations text[] NOT NULL,
  min_win_rate numeric NOT NULL DEFAULT 50,
  notification_type notification_type NOT NULL DEFAULT 'browser',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create snooptest_results table
CREATE TABLE IF NOT EXISTS snooptest_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticker text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  hold_period integer NOT NULL,
  trade_locations text[] NOT NULL,
  total_sweeps integer NOT NULL,
  win_rate numeric NOT NULL,
  average_move numeric NOT NULL,
  results_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE options_sweeps ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE snooptest_results ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_options_sweeps_ticker_date ON options_sweeps(ticker, trade_date);
CREATE INDEX IF NOT EXISTS idx_options_sweeps_trade_location ON options_sweeps(trade_location);
CREATE INDEX IF NOT EXISTS idx_user_alerts_user_id ON user_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_alerts_ticker ON user_alerts(ticker);
CREATE INDEX IF NOT EXISTS idx_snooptest_results_user_id ON snooptest_results(user_id);

-- RLS Policies for options_sweeps (public read for all authenticated users)
CREATE POLICY "Authenticated users can read sweeps data"
  ON options_sweeps
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can insert sweeps data"
  ON options_sweeps
  FOR INSERT
  TO service_role
  USING (true);

-- RLS Policies for user_alerts
CREATE POLICY "Users can manage their own alerts"
  ON user_alerts
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for snooptest_results
CREATE POLICY "Users can manage their own test results"
  ON snooptest_results
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);