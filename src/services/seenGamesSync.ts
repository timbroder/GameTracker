/**
 * Seen Games Sync Service
 *
 * Handles syncing dismissed/seen games to/from Supabase.
 * Seen games are tracked to prevent showing already-dismissed games
 * in the discovery feature.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import { getSupabaseConfig, getSyncUserId } from '../config';
import { STORAGE_KEYS, type SeenGame } from '../types';

let supabaseClient: SupabaseClient | null = null;

// Database row type (snake_case from Supabase)
interface SeenGameRow {
  id: string;
  user_id: string;
  rawg_id: number;
  platform_id: number;
  dismissed_at: string;
}

/**
 * Get or create the Supabase client
 */
function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    const config = getSupabaseConfig();
    supabaseClient = createClient(config.url, config.anonKey);
  }
  return supabaseClient;
}

/**
 * Get the user ID for sync
 */
function getUserId(): string {
  return getSyncUserId();
}

/**
 * Convert a SeenGame to a database row
 */
function seenGameToRow(seenGame: SeenGame, userId: string): SeenGameRow {
  return {
    id: seenGame.id,
    user_id: userId,
    rawg_id: seenGame.rawgId,
    platform_id: seenGame.platformId,
    dismissed_at: seenGame.dismissedAt,
  };
}

/**
 * Convert a database row to a SeenGame
 */
function rowToSeenGame(row: SeenGameRow): SeenGame {
  return {
    id: row.id,
    rawgId: row.rawg_id,
    platformId: row.platform_id,
    dismissedAt: row.dismissed_at,
  };
}

/**
 * Load seen games from local storage
 */
export async function loadSeenGames(): Promise<SeenGame[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.SEEN_GAMES);
    if (!json) return [];
    return JSON.parse(json);
  } catch (error) {
    if (__DEV__) console.error('[SeenGames] Failed to load from storage:', error);
    return [];
  }
}

/**
 * Save seen games to local storage
 */
export async function saveSeenGames(seenGames: SeenGame[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SEEN_GAMES, JSON.stringify(seenGames));
  } catch (error) {
    if (__DEV__) console.error('[SeenGames] Failed to save to storage:', error);
    throw error;
  }
}

/**
 * Add a seen game (locally)
 */
export async function addSeenGame(rawgId: number, platformId: number, name?: string): Promise<SeenGame> {
  const seenGames = await loadSeenGames();

  // Check if already exists
  const existing = seenGames.find(
    (g) => g.rawgId === rawgId && g.platformId === platformId
  );
  if (existing) {
    // Update name if it wasn't set before
    if (name && !existing.name) {
      existing.name = name;
      await saveSeenGames(seenGames);
    }
    return existing;
  }

  const newSeenGame: SeenGame = {
    id: uuidv4(),
    rawgId,
    platformId,
    dismissedAt: new Date().toISOString(),
    name,
  };

  seenGames.push(newSeenGame);
  await saveSeenGames(seenGames);
  return newSeenGame;
}

/**
 * Remove a seen game (for undo)
 */
export async function removeSeenGame(rawgId: number, platformId: number): Promise<void> {
  const seenGames = await loadSeenGames();
  const filtered = seenGames.filter(
    (g) => !(g.rawgId === rawgId && g.platformId === platformId)
  );
  await saveSeenGames(filtered);
}

/**
 * Get seen game IDs for a platform
 */
export async function getSeenGameIds(platformId: number): Promise<Set<number>> {
  const seenGames = await loadSeenGames();
  const ids = seenGames
    .filter((g) => g.platformId === platformId)
    .map((g) => g.rawgId);
  return new Set(ids);
}

/**
 * Get all seen game names (lowercase) for cross-platform duplicate detection
 */
export async function getSeenGameNames(): Promise<Set<string>> {
  const seenGames = await loadSeenGames();
  const names = seenGames
    .filter((g) => g.name)
    .map((g) => g.name!.toLowerCase());
  return new Set(names);
}

/**
 * Check if Supabase seen_games table is available
 */
export async function checkSeenGamesTableAvailable(): Promise<boolean> {
  try {
    const config = getSupabaseConfig();
    if (!config.url || !config.anonKey || config.anonKey === 'YOUR_ANON_KEY_HERE') {
      return false;
    }

    const client = getSupabaseClient();
    const { error } = await client.from('seen_games').select('id').limit(1);

    // Table doesn't exist
    if (error && error.code === '42P01') {
      if (__DEV__) console.log('[SeenGames] Table not found. Run migration 002.');
      return false;
    }

    return !error;
  } catch (error) {
    if (__DEV__) console.error('[SeenGames] Table check error:', error);
    return false;
  }
}

/**
 * Sync seen games with Supabase
 */
export async function syncSeenGames(): Promise<{
  success: boolean;
  message: string;
  uploaded?: number;
  downloaded?: number;
}> {
  try {
    const tableAvailable = await checkSeenGamesTableAvailable();
    if (!tableAvailable) {
      return { success: false, message: 'Seen games table not available' };
    }

    const userId = getUserId();
    const client = getSupabaseClient();

    // Load local seen games
    const localSeenGames = await loadSeenGames();
    const localIds = new Set(localSeenGames.map((g) => `${g.rawgId}-${g.platformId}`));

    // Download cloud seen games
    const { data: cloudRows, error: downloadError } = await client
      .from('seen_games')
      .select('*')
      .eq('user_id', userId);

    if (downloadError) {
      throw new Error(`Failed to download seen games: ${downloadError.message}`);
    }

    const cloudSeenGames = (cloudRows || []).map(rowToSeenGame);
    const cloudIds = new Set(cloudSeenGames.map((g) => `${g.rawgId}-${g.platformId}`));

    // Find games only in cloud (need to add locally)
    const newFromCloud = cloudSeenGames.filter(
      (g) => !localIds.has(`${g.rawgId}-${g.platformId}`)
    );

    // Find games only local (need to upload)
    const newToUpload = localSeenGames.filter(
      (g) => !cloudIds.has(`${g.rawgId}-${g.platformId}`)
    );

    // Merge cloud games into local
    if (newFromCloud.length > 0) {
      const merged = [...localSeenGames, ...newFromCloud];
      await saveSeenGames(merged);
    }

    // Upload new local games
    if (newToUpload.length > 0) {
      const rows = newToUpload.map((g) => seenGameToRow(g, userId));
      const { error: uploadError } = await client
        .from('seen_games')
        .upsert(rows, { onConflict: 'user_id,rawg_id,platform_id' });

      if (uploadError) {
        throw new Error(`Failed to upload seen games: ${uploadError.message}`);
      }
    }

    return {
      success: true,
      message: 'Seen games synced',
      uploaded: newToUpload.length,
      downloaded: newFromCloud.length,
    };
  } catch (error) {
    if (__DEV__) console.error('[SeenGames] Sync error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Sync failed',
    };
  }
}

/**
 * Upload a single seen game to Supabase
 */
export async function uploadSeenGame(seenGame: SeenGame): Promise<void> {
  try {
    const tableAvailable = await checkSeenGamesTableAvailable();
    if (!tableAvailable) return;

    const userId = getUserId();
    const client = getSupabaseClient();
    const row = seenGameToRow(seenGame, userId);

    const { error } = await client
      .from('seen_games')
      .upsert(row, { onConflict: 'user_id,rawg_id,platform_id' });

    if (error) {
      if (__DEV__) console.error('[SeenGames] Upload error:', error);
    }
  } catch (error) {
    if (__DEV__) console.error('[SeenGames] Upload error:', error);
  }
}

/**
 * Delete a seen game from Supabase (for undo)
 */
export async function deleteSeenGameFromCloud(
  rawgId: number,
  platformId: number
): Promise<void> {
  try {
    const tableAvailable = await checkSeenGamesTableAvailable();
    if (!tableAvailable) return;

    const userId = getUserId();
    const client = getSupabaseClient();

    const { error } = await client
      .from('seen_games')
      .delete()
      .eq('user_id', userId)
      .eq('rawg_id', rawgId)
      .eq('platform_id', platformId);

    if (error) {
      if (__DEV__) console.error('[SeenGames] Delete error:', error);
    }
  } catch (error) {
    if (__DEV__) console.error('[SeenGames] Delete error:', error);
  }
}
