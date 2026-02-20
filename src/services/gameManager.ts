/**
 * Game Manager Service - CRUD operations for games
 */

import { v4 as uuidv4 } from 'uuid';
import type { Game } from '../types/game';
import { saveGames, loadGames, addPendingDeletion } from './storage';

const NUM_COLORS = 7; // Number of Clear-style colors (0-6)

/**
 * Input type for adding a new game (without auto-generated fields)
 */
export type NewGameInput = Omit<
  Game,
  'id' | 'dateAdded' | 'sortOrder' | 'colorIndex' | 'isCompleted'
>;

/**
 * Get the next available color index (cycles through colors)
 */
function getNextColorIndex(games: Game[]): number {
  if (games.length === 0) {
    return 0;
  }
  // Find the highest color index used and cycle to next
  const maxColorIndex = Math.max(...games.map((g) => g.colorIndex));
  return (maxColorIndex + 1) % NUM_COLORS;
}

/**
 * Shift all unplayed games' sort order up by 1 to make room at the top
 * Returns a new array with updated sort orders (does not mutate original)
 */
function shiftSortOrders(games: Game[]): Game[] {
  return games.map((game) => {
    if (!game.isCompleted) {
      return { ...game, sortOrder: game.sortOrder + 1 };
    }
    return game;
  });
}

/**
 * Get the next sort order (at the end of unplayed games)
 * Used when marking a completed game as unplayed
 */
function getNextSortOrder(games: Game[]): number {
  const unplayedGames = games.filter((g) => !g.isCompleted);
  if (unplayedGames.length === 0) {
    return 0;
  }
  return Math.max(...unplayedGames.map((g) => g.sortOrder)) + 1;
}

/**
 * Add a new game to the list (at the bottom of To Play)
 */
export async function addGame(input: NewGameInput): Promise<Game> {
  const games = await loadGames();

  // Find the bottom of the To Play section
  const toPlayGames = games.filter(
    (g) => !g.isCompleted && !g.isShortListed && !g.isSomedayMaybe
  );
  const maxSortOrder = toPlayGames.length > 0
    ? Math.max(...toPlayGames.map((g) => g.sortOrder))
    : -1;

  const newGame: Game = {
    ...input,
    id: uuidv4(),
    dateAdded: new Date().toISOString(),
    sortOrder: maxSortOrder + 1,
    colorIndex: getNextColorIndex(games),
    isCompleted: false,
  };

  const updatedGames = [...games, newGame];
  await saveGames(updatedGames);

  return newGame;
}

/**
 * Update an existing game
 */
export async function updateGame(
  id: string,
  updates: Partial<Omit<Game, 'id'>>,
): Promise<Game> {
  const games = await loadGames();
  const index = games.findIndex((g) => g.id === id);

  if (index === -1) {
    throw new Error(`Game with id ${id} not found`);
  }

  const updatedGame = { ...games[index], ...updates };
  games[index] = updatedGame;

  await saveGames(games);
  return updatedGame;
}

/**
 * Delete a game from the list
 */
export async function deleteGame(id: string): Promise<void> {
  const games = await loadGames();
  const filteredGames = games.filter((g) => g.id !== id);

  if (filteredGames.length === games.length) {
    throw new Error(`Game with id ${id} not found`);
  }

  // Track the deletion so sync won't restore this game from cloud
  await addPendingDeletion(id);
  await saveGames(filteredGames);
}

/**
 * Toggle a game's completed status
 * When marking as completed: sets completedDate to now
 * When marking as unplayed: clears completedDate, assigns new sortOrder
 */
export async function toggleCompleted(id: string): Promise<Game> {
  const games = await loadGames();
  const index = games.findIndex((g) => g.id === id);

  if (index === -1) {
    throw new Error(`Game with id ${id} not found`);
  }

  const game = games[index];
  const isNowCompleted = !game.isCompleted;

  const updatedGame: Game = {
    ...game,
    isCompleted: isNowCompleted,
    completedDate: isNowCompleted ? new Date().toISOString() : undefined,
    // If marking as unplayed, give it a new sort order at the end
    sortOrder: isNowCompleted ? game.sortOrder : getNextSortOrder(games),
    // Clear short list status when completing
    isShortListed: isNowCompleted ? false : game.isShortListed,
    // When completing, clear someday maybe. When un-completing, default to someday maybe.
    isSomedayMaybe: isNowCompleted ? false : true,
  };

  games[index] = updatedGame;
  await saveGames(games);

  return updatedGame;
}

/**
 * Reorder unplayed games
 * @param reorderedIds - Array of game IDs in new order
 */
export async function reorderGames(reorderedIds: string[]): Promise<void> {
  const games = await loadGames();

  // Create a map for quick lookup
  const gameMap = new Map(games.map((g) => [g.id, g]));

  // Update sort orders based on new position
  reorderedIds.forEach((id, newIndex) => {
    const game = gameMap.get(id);
    if (game && !game.isCompleted) {
      game.sortOrder = newIndex;
    }
  });

  // Convert map back to array
  const updatedGames = Array.from(gameMap.values());
  await saveGames(updatedGames);
}

/**
 * Toggle a game's short list status
 * When adding: sets isShortListed=true, assigns sort order at end of short list
 * When removing: sets isShortListed=false, assigns sort order at top of to play
 */
export async function toggleShortList(id: string): Promise<Game> {
  const games = await loadGames();
  const index = games.findIndex((g) => g.id === id);

  if (index === -1) {
    throw new Error(`Game with id ${id} not found`);
  }

  const game = games[index];
  const isNowShortListed = !game.isShortListed;

  let newSortOrder: number;
  if (isNowShortListed) {
    // Add to end of short list
    const shortListGames = games.filter((g) => !g.isCompleted && g.isShortListed);
    newSortOrder = shortListGames.length > 0
      ? Math.max(...shortListGames.map((g) => g.sortOrder)) + 1
      : 0;
  } else {
    // Add to top of to play: shift existing to play items down
    const toPlayGames = games.filter((g) => !g.isCompleted && !g.isShortListed && g.id !== id);
    for (const g of toPlayGames) {
      const gi = games.findIndex((x) => x.id === g.id);
      if (gi !== -1) {
        games[gi] = { ...games[gi], sortOrder: games[gi].sortOrder + 1 };
      }
    }
    newSortOrder = 0;
  }

  const updatedGame: Game = {
    ...game,
    isShortListed: isNowShortListed,
    // Clear someday maybe when adding to short list
    isSomedayMaybe: isNowShortListed ? false : game.isSomedayMaybe,
    sortOrder: newSortOrder,
  };

  games[index] = updatedGame;
  await saveGames(games);
  return updatedGame;
}

/**
 * Reorder games with Short List, To Play, and Someday Maybe sections
 * @param shortListIds - Array of game IDs in Short List order
 * @param toPlayIds - Array of game IDs in To Play order
 * @param somedayMaybeIds - Array of game IDs in Someday Maybe order
 */
export async function reorderWithSections(
  shortListIds: string[],
  toPlayIds: string[],
  somedayMaybeIds: string[] = [],
): Promise<Game[]> {
  const games = await loadGames();
  const gameMap = new Map(games.map((g) => [g.id, g]));

  shortListIds.forEach((id, index) => {
    const game = gameMap.get(id);
    if (game) {
      game.isShortListed = true;
      game.isSomedayMaybe = false;
      game.sortOrder = index;
    }
  });

  toPlayIds.forEach((id, index) => {
    const game = gameMap.get(id);
    if (game) {
      game.isShortListed = false;
      game.isSomedayMaybe = false;
      game.sortOrder = index;
    }
  });

  somedayMaybeIds.forEach((id, index) => {
    const game = gameMap.get(id);
    if (game) {
      game.isShortListed = false;
      game.isSomedayMaybe = true;
      game.sortOrder = index;
    }
  });

  const updatedGames = Array.from(gameMap.values());
  await saveGames(updatedGames);
  return updatedGames;
}

/**
 * Move a game to a specific section
 * @param id - Game ID
 * @param targetSection - Target section: 'shortList' | 'toPlay' | 'somedayMaybe' | 'completed'
 */
export type GameSection = 'shortList' | 'toPlay' | 'somedayMaybe' | 'completed';

export async function moveGameToSection(
  id: string,
  targetSection: GameSection,
  position: 'top' | 'bottom' = 'bottom',
): Promise<Game> {
  const games = await loadGames();
  const index = games.findIndex((g) => g.id === id);

  if (index === -1) {
    throw new Error(`Game with id ${id} not found`);
  }

  const game = games[index];

  // Compute new flags and sort order based on target section
  let isCompleted = false;
  let isShortListed = false;
  let isSomedayMaybe = false;
  let completedDate = game.completedDate;
  let sortOrder = game.sortOrder;

  switch (targetSection) {
    case 'shortList': {
      isShortListed = true;
      const shortListGames = games.filter((g) => g.id !== id && !g.isCompleted && g.isShortListed);
      if (shortListGames.length === 0) {
        sortOrder = 0;
      } else if (position === 'top') {
        sortOrder = Math.min(...shortListGames.map((g) => g.sortOrder)) - 1;
      } else {
        sortOrder = Math.max(...shortListGames.map((g) => g.sortOrder)) + 1;
      }
      completedDate = undefined;
      break;
    }
    case 'toPlay': {
      const toPlayGames = games.filter(
        (g) => g.id !== id && !g.isCompleted && !g.isShortListed && !g.isSomedayMaybe
      );
      if (toPlayGames.length === 0) {
        sortOrder = 0;
      } else if (position === 'top') {
        sortOrder = Math.min(...toPlayGames.map((g) => g.sortOrder)) - 1;
      } else {
        sortOrder = Math.max(...toPlayGames.map((g) => g.sortOrder)) + 1;
      }
      completedDate = undefined;
      break;
    }
    case 'somedayMaybe': {
      isSomedayMaybe = true;
      const somedayGames = games.filter(
        (g) => g.id !== id && !g.isCompleted && !g.isShortListed && g.isSomedayMaybe
      );
      if (somedayGames.length === 0) {
        sortOrder = 0;
      } else if (position === 'top') {
        sortOrder = Math.min(...somedayGames.map((g) => g.sortOrder)) - 1;
      } else {
        sortOrder = Math.max(...somedayGames.map((g) => g.sortOrder)) + 1;
      }
      completedDate = undefined;
      break;
    }
    case 'completed': {
      isCompleted = true;
      completedDate = new Date().toISOString();
      break;
    }
  }

  const updatedGame: Game = {
    ...game,
    isCompleted,
    isShortListed,
    isSomedayMaybe,
    completedDate,
    sortOrder,
  };

  games[index] = updatedGame;
  await saveGames(games);
  return updatedGame;
}

/**
 * Get all games, optionally filtered
 */
export async function getGames(filter?: {
  completed?: boolean;
}): Promise<Game[]> {
  const games = await loadGames();

  if (filter?.completed !== undefined) {
    return games.filter((g) => g.isCompleted === filter.completed);
  }

  return games;
}

/**
 * Get a single game by ID
 */
export async function getGame(id: string): Promise<Game | null> {
  const games = await loadGames();
  return games.find((g) => g.id === id) || null;
}

/**
 * Check if a game (by RAWG ID and platform) already exists
 */
export async function gameExists(
  rawgId: number,
  platformId: number,
): Promise<boolean> {
  const games = await loadGames();
  return games.some((g) => g.rawgId === rawgId && g.platformId === platformId);
}
