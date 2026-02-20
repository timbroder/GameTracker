/**
 * Storage service - AsyncStorage wrapper for games and preferences
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  STORAGE_KEYS,
  UserPreferences,
  DEFAULT_PREFERENCES,
} from '../types/storage';
import type { Game } from '../types/game';

/**
 * Save games array to storage
 */
export async function saveGames(games: Game[]): Promise<void> {
  try {
    const jsonValue = JSON.stringify(games);
    await AsyncStorage.setItem(STORAGE_KEYS.GAMES, jsonValue);
  } catch (error) {
    if (__DEV__) console.error('Error saving games:', error);
    throw new Error('Failed to save games');
  }
}

/**
 * Load games array from storage
 */
export async function loadGames(): Promise<Game[]> {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.GAMES);
    if (jsonValue === null) {
      return [];
    }
    return JSON.parse(jsonValue) as Game[];
  } catch (error) {
    if (__DEV__) console.error('Error loading games:', error);
    throw new Error('Failed to load games');
  }
}

/**
 * Save user preferences to storage
 */
export async function savePreferences(
  preferences: UserPreferences,
): Promise<void> {
  try {
    const jsonValue = JSON.stringify(preferences);
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFS, jsonValue);
  } catch (error) {
    if (__DEV__) console.error('Error saving preferences:', error);
    throw new Error('Failed to save preferences');
  }
}

/**
 * Load user preferences from storage
 */
export async function loadPreferences(): Promise<UserPreferences> {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFS);
    if (jsonValue === null) {
      return DEFAULT_PREFERENCES;
    }
    // Merge with defaults to handle new preference fields
    const stored = JSON.parse(jsonValue) as Partial<UserPreferences>;
    return { ...DEFAULT_PREFERENCES, ...stored };
  } catch (error) {
    if (__DEV__) console.error('Error loading preferences:', error);
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Clear all app data (for debugging/reset)
 */
export async function clearAllData(): Promise<void> {
  try {
    const keys = Object.values(STORAGE_KEYS);
    await AsyncStorage.multiRemove(keys);
  } catch (error) {
    if (__DEV__) console.error('Error clearing data:', error);
    throw new Error('Failed to clear data');
  }
}

/**
 * Get last sync timestamp
 */
export async function getLastSync(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
  } catch (error) {
    if (__DEV__) console.error('Error getting last sync:', error);
    return null;
  }
}

/**
 * Set last sync timestamp
 */
export async function setLastSync(timestamp: string): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, timestamp);
  } catch (error) {
    if (__DEV__) console.error('Error setting last sync:', error);
    throw new Error('Failed to set last sync');
  }
}

/**
 * Add a game ID to the pending deletions list.
 * These IDs will be excluded from "new from cloud" during sync
 * to prevent deleted games from being restored.
 */
export async function addPendingDeletion(gameId: string): Promise<void> {
  try {
    const pending = await getPendingDeletions();
    if (!pending.includes(gameId)) {
      pending.push(gameId);
      await AsyncStorage.setItem(
        STORAGE_KEYS.PENDING_DELETIONS,
        JSON.stringify(pending),
      );
    }
  } catch (error) {
    if (__DEV__) console.error('Error adding pending deletion:', error);
    // Don't throw - this is a best-effort operation
  }
}

/**
 * Get all pending deletion IDs
 */
export async function getPendingDeletions(): Promise<string[]> {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_DELETIONS);
    if (jsonValue === null) {
      return [];
    }
    return JSON.parse(jsonValue) as string[];
  } catch (error) {
    if (__DEV__) console.error('Error getting pending deletions:', error);
    return [];
  }
}

/**
 * Clear specific IDs from the pending deletions list
 * (called after successful cloud deletion)
 */
export async function clearPendingDeletions(gameIds: string[]): Promise<void> {
  try {
    const pending = await getPendingDeletions();
    const remaining = pending.filter((id) => !gameIds.includes(id));
    await AsyncStorage.setItem(
      STORAGE_KEYS.PENDING_DELETIONS,
      JSON.stringify(remaining),
    );
  } catch (error) {
    if (__DEV__) console.error('Error clearing pending deletions:', error);
    // Don't throw - this is a best-effort operation
  }
}
