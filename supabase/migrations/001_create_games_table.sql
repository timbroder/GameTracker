-- Games table for syncing game data across devices
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New query)

-- Create games table
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  rawg_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  platform_id INTEGER NOT NULL,
  box_art_url TEXT DEFAULT '',
  platform_logo_url TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_date TIMESTAMPTZ,
  playtime_hours NUMERIC,
  sort_order INTEGER NOT NULL,
  date_added TIMESTAMPTZ NOT NULL,
  color_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: same game on same platform per user
  UNIQUE(user_id, rawg_id, platform_id)
);

-- Create index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_games_user_id ON games(user_id);

-- Create index for sync queries (by updated_at)
CREATE INDEX IF NOT EXISTS idx_games_updated_at ON games(user_id, updated_at);

-- Enable Row Level Security
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for now (single user app)
-- For production multi-user, you'd want proper auth policies
CREATE POLICY "Allow all access to games" ON games
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at on changes
DROP TRIGGER IF EXISTS update_games_updated_at ON games;
CREATE TRIGGER update_games_updated_at
  BEFORE UPDATE ON games
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Sync metadata table (tracks last sync time per device)
CREATE TABLE IF NOT EXISTS sync_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  device_id TEXT NOT NULL,
  last_sync_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, device_id)
);

-- Enable RLS on sync_metadata
ALTER TABLE sync_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to sync_metadata" ON sync_metadata
  FOR ALL
  USING (true)
  WITH CHECK (true);
