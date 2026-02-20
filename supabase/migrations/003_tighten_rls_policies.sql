-- Tighten RLS policies to restrict access to authorized user IDs only
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New query)
--
-- IMPORTANT: Replace the UUID below with your actual SYNC_USER_ID_PROD value
-- from src/config/secrets.ts before running this migration.

-- Create a helper function that checks if a user_id is authorized
CREATE OR REPLACE FUNCTION is_authorized_user(uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN uid IN (
    -- Add your authorized user IDs here:
    'b09fc31a-66d5-4edb-83af-a048831e3489'::UUID,  -- Production (phone)
    'ccda338b-5ebe-449a-b9c2-98db1c7e2651'::UUID   -- Development (simulator)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- === Games table ===

-- Drop the old permissive policy
DROP POLICY IF EXISTS "Allow all access to games" ON games;

-- New policy: only authorized user_ids can read their own data
CREATE POLICY "Authorized users read own games" ON games
  FOR SELECT
  USING (is_authorized_user(user_id));

-- New policy: only authorized user_ids can insert their own data
CREATE POLICY "Authorized users insert own games" ON games
  FOR INSERT
  WITH CHECK (is_authorized_user(user_id));

-- New policy: only authorized user_ids can update their own data
CREATE POLICY "Authorized users update own games" ON games
  FOR UPDATE
  USING (is_authorized_user(user_id))
  WITH CHECK (is_authorized_user(user_id));

-- New policy: only authorized user_ids can delete their own data
CREATE POLICY "Authorized users delete own games" ON games
  FOR DELETE
  USING (is_authorized_user(user_id));

-- === Seen Games table ===

DROP POLICY IF EXISTS "Allow all access to seen_games" ON seen_games;

CREATE POLICY "Authorized users read own seen_games" ON seen_games
  FOR SELECT
  USING (is_authorized_user(user_id));

CREATE POLICY "Authorized users insert own seen_games" ON seen_games
  FOR INSERT
  WITH CHECK (is_authorized_user(user_id));

CREATE POLICY "Authorized users update own seen_games" ON seen_games
  FOR UPDATE
  USING (is_authorized_user(user_id))
  WITH CHECK (is_authorized_user(user_id));

CREATE POLICY "Authorized users delete own seen_games" ON seen_games
  FOR DELETE
  USING (is_authorized_user(user_id));

-- === Sync Metadata table ===

DROP POLICY IF EXISTS "Allow all access to sync_metadata" ON sync_metadata;

CREATE POLICY "Authorized users read own sync_metadata" ON sync_metadata
  FOR SELECT
  USING (is_authorized_user(user_id));

CREATE POLICY "Authorized users insert own sync_metadata" ON sync_metadata
  FOR INSERT
  WITH CHECK (is_authorized_user(user_id));

CREATE POLICY "Authorized users update own sync_metadata" ON sync_metadata
  FOR UPDATE
  USING (is_authorized_user(user_id))
  WITH CHECK (is_authorized_user(user_id));

CREATE POLICY "Authorized users delete own sync_metadata" ON sync_metadata
  FOR DELETE
  USING (is_authorized_user(user_id));
