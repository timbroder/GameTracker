-- Seen games table for tracking dismissed games in discovery
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New query)

-- Create seen_games table
CREATE TABLE IF NOT EXISTS seen_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  rawg_id INTEGER NOT NULL,
  platform_id INTEGER NOT NULL,
  dismissed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: same game on same platform per user
  UNIQUE(user_id, rawg_id, platform_id)
);

-- Create index for fast user + platform lookups (main query pattern)
CREATE INDEX IF NOT EXISTS idx_seen_games_user_platform ON seen_games(user_id, platform_id);

-- Create index for sync queries
CREATE INDEX IF NOT EXISTS idx_seen_games_user ON seen_games(user_id);

-- Enable Row Level Security
ALTER TABLE seen_games ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for now (single user app)
CREATE POLICY "Allow all access to seen_games" ON seen_games
  FOR ALL
  USING (true)
  WITH CHECK (true);
