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
    console.error('Error saving games:', error);
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
    console.error('Error loading games:', error);
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
    console.error('Error saving preferences:', error);
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
    console.error('Error loading preferences:', error);
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
    console.error('Error clearing data:', error);
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
    console.error('Error getting last sync:', error);
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
    console.error('Error setting last sync:', error);
    throw new Error('Failed to set last sync');
  }
}
