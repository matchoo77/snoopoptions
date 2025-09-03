/*
  # SnoopTest Database Schema

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

  2. Enums
    - `option_type_enum` (call, put)
    - `trade_location_enum` (below_bid, at_bid, midpoint, at_ask, above_ask)
    - `trade_side_enum` (buy, sell, neutral)
    - `notification_type_enum` (email, browser)

  3. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
*/

-- Create enums
CREATE TYPE option_type_enum AS ENUM ('call', 'put');
CREATE TYPE trade_location_enum AS ENUM ('below_bid', 'at_bid', 'midpoint', 'at_ask', 'above_ask');
CREATE TYPE trade_side_enum AS ENUM ('buy', 'sell', 'neutral');
CREATE TYPE notification_type_enum AS ENUM ('email', 'browser');

-- Create options_sweeps table
CREATE TABLE IF NOT EXISTS options_sweeps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker text NOT NULL,
  trade_date date NOT NULL,
  option_type option_type_enum NOT NULL,
  strike_price numeric NOT NULL,
  expiration_date date NOT NULL,
  volume integer NOT NULL,
  price numeric NOT NULL,
  bid numeric NOT NULL,
  ask numeric NOT NULL,
  trade_location trade_location_enum NOT NULL,
  inferred_side trade_side_enum NOT NULL,
  premium numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(ticker, trade_date, option_type, strike_price, volume)
);

-- Create user_alerts table
CREATE TABLE IF NOT EXISTS user_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticker text NOT NULL,
  trade_locations text[] NOT NULL,
  min_win_rate numeric NOT NULL DEFAULT 50,
  notification_type notification_type_enum NOT NULL DEFAULT 'browser',
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
  total_sweeps integer NOT NULL DEFAULT 0,
  win_rate numeric NOT NULL DEFAULT 0,
  average_move numeric NOT NULL DEFAULT 0,
  results_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_options_sweeps_ticker_date ON options_sweeps(ticker, trade_date);
CREATE INDEX IF NOT EXISTS idx_options_sweeps_trade_location ON options_sweeps(trade_location);
CREATE INDEX IF NOT EXISTS idx_user_alerts_user_id ON user_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_alerts_ticker ON user_alerts(ticker);
CREATE INDEX IF NOT EXISTS idx_snooptest_results_user_id ON snooptest_results(user_id);

-- Enable Row Level Security
ALTER TABLE options_sweeps ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE snooptest_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for options_sweeps (public read, service role write)
CREATE POLICY "Anyone can read options sweeps"
  ON options_sweeps
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can insert sweeps"
  ON options_sweeps
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- RLS Policies for user_alerts
CREATE POLICY "Users can read own alerts"
  ON user_alerts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alerts"
  ON user_alerts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts"
  ON user_alerts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own alerts"
  ON user_alerts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for snooptest_results
CREATE POLICY "Users can read own test results"
  ON snooptest_results
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own test results"
  ON snooptest_results
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage test results"
  ON snooptest_results
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);