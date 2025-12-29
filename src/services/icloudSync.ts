/**
 * iCloud Sync Service
 *
 * Syncs game data to iCloud Drive using react-native-cloud-store.
 * Uses "last write wins" conflict resolution strategy.
 */

import {
  isICloudAvailable,
  getDefaultICloudContainerPath,
  writeFile,
  readFile,
  exist,
  stat,
  type ICloudPath,
} from 'react-native-cloud-store';
import type { Game } from '../types';
import { loadGames, saveGames } from './storage';

// File name for games data in iCloud
const GAMES_FILE_NAME = 'games.json';

// Metadata file to track last sync
const METADATA_FILE_NAME = 'sync_metadata.json';

interface SyncMetadata {
  lastSyncTimestamp: number;
  deviceId: string;
}

interface SyncResult {
  success: boolean;
  message: string;
  gamesCount?: number;
  direction?: 'upload' | 'download' | 'none';
}

// Generate a simple device ID (persisted in local storage)
let deviceId: string | null = null;

function getDeviceId(): string {
  if (!deviceId) {
    // Generate a random ID for this device
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  return deviceId;
}

/**
 * Get the full iCloud path for a file
 */
async function getICloudFilePath(fileName: string): Promise<ICloudPath | null> {
  try {
    const containerPath = await getDefaultICloudContainerPath();
    if (!containerPath) {
      console.log('[iCloud] No container path available');
      return null;
    }
    return `${containerPath}/Documents/${fileName}`;
  } catch (error) {
    console.error('[iCloud] Error getting container path:', error);
    return null;
  }
}

/**
 * Check if iCloud is available and configured
 */
export async function checkICloudAvailability(): Promise<{
  available: boolean;
  message: string;
}> {
  try {
    const available = await isICloudAvailable();
    if (!available) {
      return {
        available: false,
        message: 'iCloud is not available. Please sign in to iCloud and enable iCloud Drive.',
      };
    }

    const containerPath = await getDefaultICloudContainerPath();
    if (!containerPath) {
      return {
        available: false,
        message: 'iCloud container not configured. Please set up iCloud in Xcode.',
      };
    }

    return {
      available: true,
      message: 'iCloud is available and configured.',
    };
  } catch (error) {
    return {
      available: false,
      message: `iCloud check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Read games from iCloud
 */
export async function readGamesFromCloud(): Promise<Game[] | null> {
  try {
    const filePath = await getICloudFilePath(GAMES_FILE_NAME);
    if (!filePath) {
      return null;
    }

    const fileExists = await exist(filePath);
    if (!fileExists) {
      console.log('[iCloud] Games file does not exist in iCloud');
      return null;
    }

    const content = await readFile(filePath);
    const games: Game[] = JSON.parse(content);
    console.log(`[iCloud] Read ${games.length} games from iCloud`);
    return games;
  } catch (error) {
    console.error('[iCloud] Error reading games from cloud:', error);
    return null;
  }
}

/**
 * Write games to iCloud
 */
export async function writeGamesToCloud(games: Game[]): Promise<boolean> {
  try {
    const filePath = await getICloudFilePath(GAMES_FILE_NAME);
    if (!filePath) {
      return false;
    }

    const content = JSON.stringify(games, null, 2);
    await writeFile(filePath, content, { override: true });
    console.log(`[iCloud] Wrote ${games.length} games to iCloud`);

    // Update sync metadata
    await updateSyncMetadata();

    return true;
  } catch (error) {
    console.error('[iCloud] Error writing games to cloud:', error);
    return false;
  }
}

/**
 * Get the last modified timestamp of the cloud games file
 */
async function getCloudFileTimestamp(): Promise<number | null> {
  try {
    const filePath = await getICloudFilePath(GAMES_FILE_NAME);
    if (!filePath) {
      return null;
    }

    const fileExists = await exist(filePath);
    if (!fileExists) {
      return null;
    }

    const fileStats = await stat(filePath);
    return fileStats.modifyTimestamp || null;
  } catch (error) {
    console.error('[iCloud] Error getting cloud file timestamp:', error);
    return null;
  }
}

/**
 * Update sync metadata after a successful sync
 */
async function updateSyncMetadata(): Promise<void> {
  try {
    const filePath = await getICloudFilePath(METADATA_FILE_NAME);
    if (!filePath) {
      return;
    }

    const metadata: SyncMetadata = {
      lastSyncTimestamp: Date.now(),
      deviceId: getDeviceId(),
    };

    await writeFile(filePath, JSON.stringify(metadata), { override: true });
  } catch (error) {
    console.error('[iCloud] Error updating sync metadata:', error);
  }
}

/**
 * Get the last sync timestamp from local storage
 */
let lastLocalSyncTimestamp: number = 0;

export function getLastSyncTimestamp(): number {
  return lastLocalSyncTimestamp;
}

export function setLastSyncTimestamp(timestamp: number): void {
  lastLocalSyncTimestamp = timestamp;
}

/**
 * Sync games with iCloud using "last write wins" strategy
 *
 * This compares the local and cloud timestamps and syncs in the appropriate direction:
 * - If cloud is newer: download from cloud
 * - If local is newer: upload to cloud
 * - If equal or no cloud data: upload to cloud
 */
export async function syncGames(): Promise<SyncResult> {
  try {
    // Check iCloud availability
    const { available, message } = await checkICloudAvailability();
    if (!available) {
      return { success: false, message };
    }

    // Get local games
    const localGames = await loadGames();
    const localTimestamp = lastLocalSyncTimestamp || Date.now();

    // Get cloud file timestamp
    const cloudTimestamp = await getCloudFileTimestamp();

    // If no cloud data exists, upload local data
    if (cloudTimestamp === null) {
      console.log('[iCloud] No cloud data, uploading local games');
      const success = await writeGamesToCloud(localGames);
      if (success) {
        setLastSyncTimestamp(Date.now());
        return {
          success: true,
          message: 'Uploaded games to iCloud',
          gamesCount: localGames.length,
          direction: 'upload',
        };
      }
      return { success: false, message: 'Failed to upload to iCloud' };
    }

    // Compare timestamps - cloud is newer, download
    if (cloudTimestamp > localTimestamp) {
      console.log('[iCloud] Cloud is newer, downloading');
      const cloudGames = await readGamesFromCloud();
      if (cloudGames) {
        await saveGames(cloudGames);
        setLastSyncTimestamp(Date.now());
        return {
          success: true,
          message: 'Downloaded games from iCloud',
          gamesCount: cloudGames.length,
          direction: 'download',
        };
      }
      return { success: false, message: 'Failed to download from iCloud' };
    }

    // Local is newer or equal, upload
    console.log('[iCloud] Local is newer, uploading');
    const success = await writeGamesToCloud(localGames);
    if (success) {
      setLastSyncTimestamp(Date.now());
      return {
        success: true,
        message: 'Uploaded games to iCloud',
        gamesCount: localGames.length,
        direction: 'upload',
      };
    }
    return { success: false, message: 'Failed to upload to iCloud' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[iCloud] Sync error:', error);
    return {
      success: false,
      message: `Sync failed: ${errorMessage}`,
    };
  }
}

/**
 * Force upload local games to iCloud (overwrite cloud data)
 */
export async function forceUploadToCloud(): Promise<SyncResult> {
  try {
    const { available, message } = await checkICloudAvailability();
    if (!available) {
      return { success: false, message };
    }

    const localGames = await loadGames();
    const success = await writeGamesToCloud(localGames);

    if (success) {
      setLastSyncTimestamp(Date.now());
      return {
        success: true,
        message: 'Force uploaded games to iCloud',
        gamesCount: localGames.length,
        direction: 'upload',
      };
    }

    return { success: false, message: 'Failed to upload to iCloud' };
  } catch (error) {
    return {
      success: false,
      message: `Force upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Force download games from iCloud (overwrite local data)
 */
export async function forceDownloadFromCloud(): Promise<SyncResult> {
  try {
    const { available, message } = await checkICloudAvailability();
    if (!available) {
      return { success: false, message };
    }

    const cloudGames = await readGamesFromCloud();
    if (cloudGames) {
      await saveGames(cloudGames);
      setLastSyncTimestamp(Date.now());
      return {
        success: true,
        message: 'Force downloaded games from iCloud',
        gamesCount: cloudGames.length,
        direction: 'download',
      };
    }

    return { success: false, message: 'No games found in iCloud' };
  } catch (error) {
    return {
      success: false,
      message: `Force download failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
