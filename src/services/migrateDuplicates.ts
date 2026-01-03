/**
 * One-time migration to clean up duplicate games across platforms
 *
 * If the same game (by name) exists multiple times in the collection,
 * this migration keeps only the one with the latest release date.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadGames, saveGames } from './storage';
import { getGameDetails } from './rawgApi';
import type { Game } from '../types';

const MIGRATION_KEY = '@gametracker:migration:duplicates_v1';

interface GameWithReleaseDate extends Game {
  releaseDate?: string | null;
}

/**
 * Check if migration has already run
 */
async function hasMigrationRun(): Promise<boolean> {
  const value = await AsyncStorage.getItem(MIGRATION_KEY);
  return value === 'completed';
}

/**
 * Mark migration as completed
 */
async function markMigrationComplete(): Promise<void> {
  await AsyncStorage.setItem(MIGRATION_KEY, 'completed');
}

/**
 * Fetch release date for a game from RAWG API
 */
async function fetchReleaseDate(rawgId: number): Promise<string | null> {
  try {
    const details = await getGameDetails(rawgId);
    return details.released || null;
  } catch (error) {
    console.error(`[Migration] Failed to fetch release date for rawgId ${rawgId}:`, error);
    return null;
  }
}

/**
 * Parse release date string to comparable value
 * Returns timestamp for comparison, or 0 if invalid
 */
function parseReleaseDate(dateStr: string | null | undefined): number {
  if (!dateStr) return 0;

  // Handle formats: "YYYY-MM-DD", "YYYY-MM", "YYYY"
  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parts.length >= 2 ? parseInt(parts[1], 10) - 1 : 0;
  const day = parts.length >= 3 ? parseInt(parts[2], 10) : 1;

  return new Date(year, month, day).getTime();
}

/**
 * Run the duplicate cleanup migration
 */
export async function runDuplicateMigration(): Promise<{
  success: boolean;
  message: string;
  removedCount?: number;
}> {
  try {
    // Check if already run
    if (await hasMigrationRun()) {
      return { success: true, message: 'Migration already completed' };
    }

    console.log('[Migration] Starting duplicate cleanup migration...');

    const games = await loadGames();
    if (games.length === 0) {
      await markMigrationComplete();
      return { success: true, message: 'No games to migrate', removedCount: 0 };
    }

    // Group games by lowercase name
    const gamesByName = new Map<string, Game[]>();
    for (const game of games) {
      const key = game.name.toLowerCase();
      if (!gamesByName.has(key)) {
        gamesByName.set(key, []);
      }
      gamesByName.get(key)!.push(game);
    }

    // Find duplicates (groups with more than one game)
    const duplicateGroups = Array.from(gamesByName.entries()).filter(
      ([_, groupGames]) => groupGames.length > 1
    );

    if (duplicateGroups.length === 0) {
      console.log('[Migration] No duplicates found');
      await markMigrationComplete();
      return { success: true, message: 'No duplicates found', removedCount: 0 };
    }

    console.log(`[Migration] Found ${duplicateGroups.length} duplicate groups`);

    // Track which games to keep and which to remove
    const gamesToRemove = new Set<string>();

    // Process each duplicate group
    for (const [name, groupGames] of duplicateGroups) {
      console.log(`[Migration] Processing "${name}" (${groupGames.length} copies)`);

      // Fetch release dates for all games in the group
      const gamesWithDates: GameWithReleaseDate[] = await Promise.all(
        groupGames.map(async (game) => {
          const releaseDate = await fetchReleaseDate(game.rawgId);
          return { ...game, releaseDate };
        })
      );

      // Sort by release date (latest first)
      gamesWithDates.sort((a, b) => {
        const dateA = parseReleaseDate(a.releaseDate);
        const dateB = parseReleaseDate(b.releaseDate);
        return dateB - dateA; // Latest first
      });

      // Keep the first one (latest release), mark others for removal
      const [keeper, ...toRemove] = gamesWithDates;
      console.log(
        `[Migration] Keeping "${keeper.name}" on ${keeper.platform} (released: ${keeper.releaseDate || 'unknown'})`
      );

      for (const game of toRemove) {
        console.log(
          `[Migration] Removing "${game.name}" on ${game.platform} (released: ${game.releaseDate || 'unknown'})`
        );
        gamesToRemove.add(game.id);
      }
    }

    // Filter out removed games
    const updatedGames = games.filter((game) => !gamesToRemove.has(game.id));

    // Save updated games list
    await saveGames(updatedGames);

    // Mark migration as complete
    await markMigrationComplete();

    const removedCount = gamesToRemove.size;
    console.log(`[Migration] Completed. Removed ${removedCount} duplicate games.`);

    return {
      success: true,
      message: `Removed ${removedCount} duplicate games`,
      removedCount,
    };
  } catch (error) {
    console.error('[Migration] Failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Migration failed',
    };
  }
}

/**
 * Reset migration (for testing purposes)
 */
export async function resetDuplicateMigration(): Promise<void> {
  await AsyncStorage.removeItem(MIGRATION_KEY);
  console.log('[Migration] Migration reset');
}
