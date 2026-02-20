/**
 * One-time migration to move all "To Play" games into "Someday, Maybe"
 *
 * "To Play" = !isCompleted && !isShortListed && !isSomedayMaybe
 * Sets isSomedayMaybe = true on those games.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadGames, saveGames } from './storage';

const MIGRATION_KEY = '@gametracker:migration:to_play_to_someday_v1';

async function hasMigrationRun(): Promise<boolean> {
  const value = await AsyncStorage.getItem(MIGRATION_KEY);
  return value === 'completed';
}

async function markMigrationComplete(): Promise<void> {
  await AsyncStorage.setItem(MIGRATION_KEY, 'completed');
}

export async function runToPlayToSomedayMaybeMigration(): Promise<{
  success: boolean;
  message: string;
  migratedCount?: number;
}> {
  try {
    if (await hasMigrationRun()) {
      return { success: true, message: 'Migration already completed' };
    }

    if (__DEV__) console.log('[Migration] Starting To Play → Someday Maybe migration...');

    const games = await loadGames();
    if (games.length === 0) {
      await markMigrationComplete();
      return { success: true, message: 'No games to migrate', migratedCount: 0 };
    }

    let migratedCount = 0;
    const updatedGames = games.map((game) => {
      if (!game.isCompleted && !game.isShortListed && !game.isSomedayMaybe) {
        migratedCount++;
        return { ...game, isSomedayMaybe: true };
      }
      return game;
    });

    if (migratedCount > 0) {
      await saveGames(updatedGames);
    }

    await markMigrationComplete();

    if (__DEV__) console.log(`[Migration] Moved ${migratedCount} games from To Play to Someday Maybe.`);

    return {
      success: true,
      message: `Moved ${migratedCount} games to Someday Maybe`,
      migratedCount,
    };
  } catch (error) {
    if (__DEV__) console.error('[Migration] To Play → Someday Maybe migration failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Migration failed',
    };
  }
}
