/**
 * Supabase Sync Service
 *
 * Handles syncing game data to/from Supabase for cross-device sync.
 * Uses a simple "merge" strategy: combines local and cloud data,
 * with cloud data taking precedence for conflicts.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import { getSupabaseConfig, getSyncUserId } from '../config';
import { loadGames, saveGames } from './storage';
import type { Game } from '../types';

const DEVICE_ID_KEY = '@gametracker:device_id';
const LAST_SYNC_KEY = '@gametracker:last_supabase_sync';

let supabaseClient: SupabaseClient | null = null;

// Database row type (snake_case from Supabase)
interface GameRow {
  id: string;
  user_id: string;
  rawg_id: number;
  name: string;
  platform: string;
  platform_id: number;
  box_art_url: string;
  platform_logo_url: string | null;
  is_completed: boolean;
  completed_date: string | null;
  playtime_hours: number | null;
  sort_order: number;
  date_added: string;
  color_index: number;
  updated_at: string;
}

export interface SyncResult {
  success: boolean;
  message: string;
  gamesUploaded?: number;
  gamesDownloaded?: number;
  gamesDeleted?: number;
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
 * Uses the fixed ID from config so all your devices share the same data
 */
export function getUserId(): string {
  return getSyncUserId();
}

/**
 * Get or create a device ID (unique per device)
 */
async function getDeviceId(): Promise<string> {
  let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = uuidv4();
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

/**
 * Get the last sync timestamp
 */
export function getLastSyncTimestamp(): number {
  // This is synchronous for the hook, but we'll also have async version
  return 0; // Will be loaded async
}

/**
 * Get the last sync timestamp (async)
 */
export async function getLastSyncTimestampAsync(): Promise<number> {
  const timestamp = await AsyncStorage.getItem(LAST_SYNC_KEY);
  return timestamp ? parseInt(timestamp, 10) : 0;
}

/**
 * Set the last sync timestamp
 */
export async function setLastSyncTimestamp(timestamp: number): Promise<void> {
  await AsyncStorage.setItem(LAST_SYNC_KEY, timestamp.toString());
}

/**
 * Convert a Game object to a database row
 */
function gameToRow(game: Game, userId: string): Omit<GameRow, 'updated_at'> {
  return {
    id: game.id,
    user_id: userId,
    rawg_id: game.rawgId,
    name: game.name,
    platform: game.platform,
    platform_id: game.platformId,
    box_art_url: game.boxArtUrl,
    platform_logo_url: game.platformLogoUrl || null,
    is_completed: game.isCompleted,
    completed_date: game.completedDate || null,
    playtime_hours: game.playtimeHours || null,
    sort_order: game.sortOrder,
    date_added: game.dateAdded,
    color_index: game.colorIndex,
  };
}

/**
 * Convert a database row to a Game object
 */
function rowToGame(row: GameRow): Game {
  return {
    id: row.id,
    rawgId: row.rawg_id,
    name: row.name,
    platform: row.platform,
    platformId: row.platform_id,
    boxArtUrl: row.box_art_url,
    platformLogoUrl: row.platform_logo_url || undefined,
    isCompleted: row.is_completed,
    completedDate: row.completed_date || undefined,
    playtimeHours: row.playtime_hours || undefined,
    sortOrder: row.sort_order,
    dateAdded: row.date_added,
    colorIndex: row.color_index,
  };
}

/**
 * Check if Supabase is configured and reachable
 */
export async function checkSupabaseAvailability(): Promise<{
  available: boolean;
  message: string;
}> {
  try {
    const config = getSupabaseConfig();
    console.log('[Supabase Sync] Config URL:', config.url);
    console.log('[Supabase Sync] Config key starts with:', config.anonKey?.substring(0, 20) + '...');

    if (!config.url || !config.anonKey || config.anonKey === 'YOUR_ANON_KEY_HERE') {
      return {
        available: false,
        message: 'Supabase not configured. Add your anon key to secrets.ts',
      };
    }

    const client = getSupabaseClient();
    // Try a simple query to check connectivity
    const { error } = await client.from('games').select('id').limit(1);

    if (error) {
      console.error('[Supabase Sync] Availability check error:', error);
      // Table doesn't exist yet is ok, other errors are not
      if (error.code === '42P01') {
        return {
          available: false,
          message: 'Games table not found. Run the migration in Supabase.',
        };
      }
      return {
        available: false,
        message: `Supabase error: ${error.message}`,
      };
    }

    return { available: true, message: 'Connected' };
  } catch (error) {
    console.error('[Supabase Sync] Availability exception:', error);
    return {
      available: false,
      message: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

/**
 * Upload all local games to Supabase (upsert)
 */
async function uploadGames(games: Game[], userId: string): Promise<number> {
  if (games.length === 0) return 0;

  const client = getSupabaseClient();
  const rows = games.map((game) => gameToRow(game, userId));

  const { error } = await client.from('games').upsert(rows, {
    onConflict: 'id',
  });

  if (error) {
    console.error('[Supabase Sync] Upload error:', error);
    throw new Error(`Failed to upload games: ${error.message}`);
  }

  return games.length;
}

/**
 * Download all games from Supabase for this user
 */
async function downloadGames(userId: string): Promise<Game[]> {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('games')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true });

  if (error) {
    throw new Error(`Failed to download games: ${error.message}`);
  }

  return (data || []).map(rowToGame);
}

/**
 * Delete games from Supabase that no longer exist locally
 */
async function deleteRemovedGames(
  localGameIds: Set<string>,
  cloudGames: Game[],
  userId: string
): Promise<number> {
  const gamesToDelete = cloudGames.filter((g) => !localGameIds.has(g.id));

  if (gamesToDelete.length === 0) return 0;

  const client = getSupabaseClient();
  const idsToDelete = gamesToDelete.map((g) => g.id);

  const { error } = await client
    .from('games')
    .delete()
    .eq('user_id', userId)
    .in('id', idsToDelete);

  if (error) {
    throw new Error(`Failed to delete games: ${error.message}`);
  }

  return gamesToDelete.length;
}

/**
 * Sync games with Supabase
 *
 * Strategy:
 * 1. Download cloud games
 * 2. Merge: cloud games that don't exist locally are added
 * 3. Upload: all local games are upserted to cloud
 * 4. Delete: games deleted locally are removed from cloud
 */
export async function syncGames(): Promise<SyncResult> {
  try {
    // Check availability first
    const { available, message } = await checkSupabaseAvailability();
    console.log('[Supabase Sync] Availability:', available, message);
    if (!available) {
      return { success: false, message };
    }

    const userId = getUserId();
    const deviceId = await getDeviceId();
    console.log('[Supabase Sync] User ID:', userId, 'Device ID:', deviceId);

    // Get local games
    const localGames = await loadGames();
    console.log('[Supabase Sync] Local games count:', localGames.length);
    const localGameIds = new Set(localGames.map((g) => g.id));
    const localGamesMap = new Map(localGames.map((g) => [g.id, g]));

    // Download cloud games
    const cloudGames = await downloadGames(userId);
    const cloudGameIds = new Set(cloudGames.map((g) => g.id));

    // Find games only in cloud (need to add locally)
    const newFromCloud = cloudGames.filter((g) => !localGameIds.has(g.id));

    // Merge: add cloud-only games to local
    let mergedGames = [...localGames];
    if (newFromCloud.length > 0) {
      // Assign sort orders for new games
      const maxSortOrder = Math.max(0, ...localGames.map((g) => g.sortOrder));
      newFromCloud.forEach((game, index) => {
        game.sortOrder = maxSortOrder + index + 1;
        mergedGames.push(game);
      });
      await saveGames(mergedGames);
    }

    // Upload all local games to cloud
    console.log('[Supabase Sync] Uploading', mergedGames.length, 'games...');
    const uploaded = await uploadGames(mergedGames, userId);
    console.log('[Supabase Sync] Uploaded:', uploaded);

    // Delete games from cloud that were deleted locally
    const deleted = await deleteRemovedGames(localGameIds, cloudGames, userId);

    // Update sync metadata
    const client = getSupabaseClient();
    await client.from('sync_metadata').upsert({
      user_id: userId,
      device_id: deviceId,
      last_sync_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,device_id',
    });

    // Save sync timestamp locally
    await setLastSyncTimestamp(Date.now());

    return {
      success: true,
      message: newFromCloud.length > 0
        ? `Synced: ${newFromCloud.length} new games from cloud`
        : 'Games synced',
      gamesUploaded: uploaded,
      gamesDownloaded: newFromCloud.length,
      gamesDeleted: deleted,
    };
  } catch (error) {
    console.error('Sync error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Sync failed',
    };
  }
}

/**
 * Force upload all local games to Supabase
 */
export async function forceUploadToCloud(): Promise<SyncResult> {
  try {
    const { available, message } = await checkSupabaseAvailability();
    if (!available) {
      return { success: false, message };
    }

    const userId = getUserId();
    const localGames = await loadGames();
    const uploaded = await uploadGames(localGames, userId);

    await setLastSyncTimestamp(Date.now());

    return {
      success: true,
      message: `Uploaded ${uploaded} games`,
      gamesUploaded: uploaded,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Force download all games from Supabase (replaces local)
 */
export async function forceDownloadFromCloud(): Promise<SyncResult> {
  try {
    const { available, message } = await checkSupabaseAvailability();
    if (!available) {
      return { success: false, message };
    }

    const userId = getUserId();
    const cloudGames = await downloadGames(userId);
    await saveGames(cloudGames);

    await setLastSyncTimestamp(Date.now());

    return {
      success: true,
      message: `Downloaded ${cloudGames.length} games`,
      gamesDownloaded: cloudGames.length,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Download failed',
    };
  }
}

