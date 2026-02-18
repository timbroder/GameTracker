/**
 * One-time migration to move existing "To Play" games to "Someday, Maybe"
 *
 * All games that are !isCompleted && !isShortListed get isSomedayMaybe = true.
 * This creates the initial funnel where discovery games land in Someday Maybe.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadGames, saveGames } from './storage';

const MIGRATION_KEY = '@gametracker:migration:someday_maybe_v1';

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
 * Run the Someday Maybe migration
 */
export async function runSomedayMaybeMigration(): Promise<{
  success: boolean;
  message: string;
  migratedCount?: number;
}> {
  try {
    if (await hasMigrationRun()) {
      return { success: true, message: 'Migration already completed' };
    }

    console.log('[Migration] Starting Someday Maybe migration...');

    const games = await loadGames();
    if (games.length === 0) {
      await markMigrationComplete();
      return { success: true, message: 'No games to migrate', migratedCount: 0 };
    }

    let migratedCount = 0;
    const updatedGames = games.map((game) => {
      if (!game.isCompleted && !game.isShortListed) {
        migratedCount++;
        return { ...game, isSomedayMaybe: true };
      }
      return game;
    });

    if (migratedCount > 0) {
      await saveGames(updatedGames);
    }

    await markMigrationComplete();

    console.log(`[Migration] Someday Maybe migration completed. Migrated ${migratedCount} games.`);

    return {
      success: true,
      message: `Migrated ${migratedCount} games to Someday Maybe`,
      migratedCount,
    };
  } catch (error) {
    console.error('[Migration] Someday Maybe migration failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Migration failed',
    };
  }
}
