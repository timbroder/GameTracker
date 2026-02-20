/**
 * Game sorting utilities
 */

import type { Game } from '../types';

export interface SortedGames {
  shortList: Game[];
  unplayed: Game[];
  somedayMaybe: Game[];
  completed: Game[];
}

/**
 * Sort games into unplayed and completed sections
 * - Unplayed: sorted by sortOrder ascending
 * - Completed: sorted by completedDate descending (most recent first)
 */
export function sortGames(games: Game[]): SortedGames {
  // Single-pass bucketing instead of 4 separate filter passes
  const shortList: Game[] = [];
  const unplayed: Game[] = [];
  const somedayMaybe: Game[] = [];
  const completed: Game[] = [];

  for (const game of games) {
    if (game.isCompleted) {
      completed.push(game);
    } else if (game.isShortListed) {
      shortList.push(game);
    } else if (game.isSomedayMaybe) {
      somedayMaybe.push(game);
    } else {
      unplayed.push(game);
    }
  }

  shortList.sort((a, b) => a.sortOrder - b.sortOrder);
  unplayed.sort((a, b) => a.sortOrder - b.sortOrder);
  somedayMaybe.sort((a, b) => a.sortOrder - b.sortOrder);
  completed.sort((a, b) => {
    const dateA = a.completedDate ? new Date(a.completedDate).getTime() : 0;
    const dateB = b.completedDate ? new Date(b.completedDate).getTime() : 0;
    return dateB - dateA;
  });

  return { shortList, unplayed, somedayMaybe, completed };
}

/**
 * Get the next sort order for a new game
 * Returns max sortOrder + 1 of unplayed games, or 0 if no games
 */
export function getNextSortOrder(games: Game[]): number {
  const unplayedGames = games.filter((game) => !game.isCompleted);
  if (unplayedGames.length === 0) {
    return 0;
  }
  const maxOrder = Math.max(...unplayedGames.map((g) => g.sortOrder));
  return maxOrder + 1;
}

/**
 * Reorder games based on new order of IDs
 * Returns updated games with new sortOrder values
 */
export function reorderGamesList(
  games: Game[],
  newOrderIds: string[]
): Game[] {
  const gameMap = new Map(games.map((g) => [g.id, g]));

  return games.map((game) => {
    const newIndex = newOrderIds.indexOf(game.id);
    if (newIndex !== -1) {
      return { ...game, sortOrder: newIndex };
    }
    return game;
  });
}

/**
 * Check if a game list has any unplayed games
 */
export function hasUnplayedGames(games: Game[]): boolean {
  return games.some((game) => !game.isCompleted);
}

/**
 * Check if a game list has any completed games
 */
export function hasCompletedGames(games: Game[]): boolean {
  return games.some((game) => game.isCompleted);
}
