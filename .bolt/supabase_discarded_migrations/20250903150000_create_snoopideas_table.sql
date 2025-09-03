/*
  # Create SnoopIdeas table for caching Benzinga analyst ratings
  
  This table will store analyst ratings/upgrades/downgrades data from Polygon Benzinga API
  to avoid hitting rate limits and provide faster loading.
*/

-- Create the snoopideas table with your exact schema
CREATE TABLE IF NOT EXISTS snoopideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker text NOT NULL,
  action_type text NOT NULL,
  fetched_at timestamp DEFAULT now()
);

-- Enable RLS
ALTER TABLE snoopideas ENABLE ROW LEVEL SECURITY;

-- Create unique constraint to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS snoopideas_unique_idx 
ON snoopideas(ticker, action_type, DATE(fetched_at));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS snoopideas_ticker_idx ON snoopideas(ticker);
CREATE INDEX IF NOT EXISTS snoopideas_fetched_at_idx ON snoopideas(fetched_at DESC);

-- RLS Policies - Allow all authenticated users to read and insert
CREATE POLICY "Anyone can read snoopideas"
  ON snoopideas
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can insert snoopideas"
  ON snoopideas
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Grant permissions
GRANT SELECT, INSERT ON snoopideas TO authenticated;
