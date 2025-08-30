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
    - Service role can manage sweep data
*/

-- Create enums with safe checks
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'option_type_enum') THEN
    CREATE TYPE option_type_enum AS ENUM ('call', 'put');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trade_location_enum') THEN
    CREATE TYPE trade_location_enum AS ENUM ('below_bid', 'at_bid', 'midpoint', 'at_ask', 'above_ask');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trade_side_enum') THEN
    CREATE TYPE trade_side_enum AS ENUM ('buy', 'sell', 'neutral');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type_enum') THEN
    CREATE TYPE notification_type_enum AS ENUM ('email', 'browser');
  END IF;
END $$;

-- Create options_sweeps table with safe check
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
  created_at timestamptz DEFAULT now()
);

-- Create user_alerts table with safe check
CREATE TABLE IF NOT EXISTS user_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ticker text NOT NULL,
  trade_locations text[] NOT NULL,
  min_win_rate numeric NOT NULL DEFAULT 50,
  notification_type notification_type_enum NOT NULL DEFAULT 'browser',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create snooptest_results table with safe check
CREATE TABLE IF NOT EXISTS snooptest_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
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

-- Add foreign key constraints safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_alerts_user_id_fkey'
  ) THEN
    ALTER TABLE user_alerts ADD CONSTRAINT user_alerts_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'snooptest_results_user_id_fkey'
  ) THEN
    ALTER TABLE snooptest_results ADD CONSTRAINT snooptest_results_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for performance with safe checks
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_options_sweeps_ticker_date') THEN
    CREATE INDEX idx_options_sweeps_ticker_date ON options_sweeps(ticker, trade_date);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_options_sweeps_trade_location') THEN
    CREATE INDEX idx_options_sweeps_trade_location ON options_sweeps(trade_location);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_alerts_user_id') THEN
    CREATE INDEX idx_user_alerts_user_id ON user_alerts(user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_alerts_ticker') THEN
    CREATE INDEX idx_user_alerts_ticker ON user_alerts(ticker);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_snooptest_results_user_id') THEN
    CREATE INDEX idx_snooptest_results_user_id ON snooptest_results(user_id);
  END IF;
END $$;

-- Create unique constraint for sweeps to prevent duplicates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'options_sweeps_unique_trade'
  ) THEN
    ALTER TABLE options_sweeps ADD CONSTRAINT options_sweeps_unique_trade 
    UNIQUE (ticker, trade_date, option_type, strike_price, volume);
  END IF;
END $$;

-- Enable Row Level Security with safe checks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'options_sweeps' AND rowsecurity = true
  ) THEN
    ALTER TABLE options_sweeps ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'user_alerts' AND rowsecurity = true
  ) THEN
    ALTER TABLE user_alerts ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'snooptest_results' AND rowsecurity = true
  ) THEN
    ALTER TABLE snooptest_results ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create RLS policies with safe checks

-- Options sweeps policies (public read, service role write)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'options_sweeps' AND policyname = 'Anyone can read options sweeps'
  ) THEN
    CREATE POLICY "Anyone can read options sweeps"
      ON options_sweeps
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'options_sweeps' AND policyname = 'Service role can insert sweeps'
  ) THEN
    CREATE POLICY "Service role can insert sweeps"
      ON options_sweeps
      FOR INSERT
      TO service_role
      WITH CHECK (true);
  END IF;
END $$;

-- User alerts policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_alerts' AND policyname = 'Users can read own alerts'
  ) THEN
    CREATE POLICY "Users can read own alerts"
      ON user_alerts
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_alerts' AND policyname = 'Users can insert own alerts'
  ) THEN
    CREATE POLICY "Users can insert own alerts"
      ON user_alerts
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_alerts' AND policyname = 'Users can update own alerts'
  ) THEN
    CREATE POLICY "Users can update own alerts"
      ON user_alerts
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_alerts' AND policyname = 'Users can delete own alerts'
  ) THEN
    CREATE POLICY "Users can delete own alerts"
      ON user_alerts
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- SnoopTest results policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'snooptest_results' AND policyname = 'Users can read own test results'
  ) THEN
    CREATE POLICY "Users can read own test results"
      ON snooptest_results
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'snooptest_results' AND policyname = 'Users can insert own test results'
  ) THEN
    CREATE POLICY "Users can insert own test results"
      ON snooptest_results
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'snooptest_results' AND policyname = 'Service role can manage test results'
  ) THEN
    CREATE POLICY "Service role can manage test results"
      ON snooptest_results
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;