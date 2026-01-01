/**
 * Discovery Service - Handle adding games from discovery
 */

import { v4 as uuidv4 } from 'uuid';
import type { Game, DiscoveryGame, LegacyPlatform } from '../types';
import { saveGames, loadGames } from './storage';

const NUM_COLORS = 7;

/**
 * Parse a release date and return a completion date
 * Formats: "YYYY-MM-DD", "YYYY-MM", "YYYY"
 * Returns ISO date string for the release date, or today if no date
 */
function getCompletionDate(released: string | null): string {
  if (!released) {
    return new Date().toISOString();
  }

  // Handle different formats
  // "YYYY-MM-DD" -> use as-is
  // "YYYY-MM" -> use 1st of month
  // "YYYY" -> use Jan 1

  const parts = released.split('-');
  const year = parseInt(parts[0], 10);
  const month = parts.length >= 2 ? parseInt(parts[1], 10) - 1 : 0;
  const day = parts.length >= 3 ? parseInt(parts[2], 10) : 1;

  const date = new Date(year, month, day, 12, 0, 0);
  return date.toISOString();
}

/**
 * Get the next available color index
 */
function getNextColorIndex(games: Game[]): number {
  if (games.length === 0) return 0;
  const maxColorIndex = Math.max(...games.map((g) => g.colorIndex));
  return (maxColorIndex + 1) % NUM_COLORS;
}

/**
 * Add a game from discovery as completed
 * @param game - The game from discovery
 * @param platform - The legacy platform
 */
export async function addGameAsCompleted(
  game: DiscoveryGame,
  platform: LegacyPlatform
): Promise<Game> {
  const games = await loadGames();

  // Check if game already exists for this platform
  const exists = games.some(
    (g) => g.rawgId === game.id && g.platformId === platform.id
  );

  if (exists) {
    throw new Error('Game already in collection');
  }

  const newGame: Game = {
    id: uuidv4(),
    rawgId: game.id,
    name: game.name,
    platform: platform.name,
    platformId: platform.id,
    boxArtUrl: game.backgroundImage || '',
    isCompleted: true,
    completedDate: getCompletionDate(game.released),
    sortOrder: 0, // Completed games don't need sort order
    dateAdded: new Date().toISOString(),
    colorIndex: getNextColorIndex(games),
  };

  const updatedGames = [...games, newGame];
  await saveGames(updatedGames);

  return newGame;
}

/**
 * Add a game from discovery to "To Play" list (not completed)
 * @param game - The game from discovery
 * @param platform - The legacy platform
 */
export async function addGameAsToPlay(
  game: DiscoveryGame,
  platform: LegacyPlatform
): Promise<Game> {
  const games = await loadGames();

  // Check if game already exists for this platform
  const exists = games.some(
    (g) => g.rawgId === game.id && g.platformId === platform.id
  );

  if (exists) {
    throw new Error('Game already in collection');
  }

  // Find max sortOrder among non-completed games to add at bottom
  const toPlayGames = games.filter((g) => !g.isCompleted);
  const maxSortOrder = toPlayGames.length > 0
    ? Math.max(...toPlayGames.map((g) => g.sortOrder))
    : -1;

  const newGame: Game = {
    id: uuidv4(),
    rawgId: game.id,
    name: game.name,
    platform: platform.name,
    platformId: platform.id,
    boxArtUrl: game.backgroundImage || '',
    isCompleted: false,
    sortOrder: maxSortOrder + 1,
    dateAdded: new Date().toISOString(),
    colorIndex: getNextColorIndex(games),
  };

  const updatedGames = [...games, newGame];
  await saveGames(updatedGames);

  return newGame;
}

/**
 * Check if a game exists in the collection
 */
export async function isGameInCollection(
  rawgId: number,
  platformId: number
): Promise<boolean> {
  const games = await loadGames();
  return games.some((g) => g.rawgId === rawgId && g.platformId === platformId);
}
