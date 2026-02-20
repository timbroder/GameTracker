/**
 * useGames - Hook for managing game list state
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Game } from '../types';
import {
  getGames,
  addGame as addGameService,
  updateGame as updateGameService,
  deleteGame as deleteGameService,
  toggleCompleted as toggleCompletedService,
  reorderGames as reorderGamesService,
  reorderWithSections as reorderWithSectionsService,
  toggleShortList as toggleShortListService,
  moveGameToSection as moveGameToSectionService,
  type NewGameInput,
  type GameSection,
} from '../services/gameManager';
import { sortGames, type SortedGames } from '../utils/sorting';

export interface UseGamesState {
  games: Game[];
  sortedGames: SortedGames;
  loading: boolean;
  error: string | null;
}

export interface UseGamesActions {
  loadGames: () => Promise<void>;
  addGame: (input: NewGameInput) => Promise<Game>;
  updateGame: (id: string, updates: Partial<Game>) => Promise<Game>;
  deleteGame: (id: string) => Promise<void>;
  toggleCompleted: (id: string) => Promise<Game>;
  reorderGames: (reorderedIds: string[]) => Promise<void>;
  reorderWithSections: (shortListIds: string[], toPlayIds: string[], somedayMaybeIds?: string[]) => Promise<void>;
  toggleShortList: (id: string) => Promise<Game>;
  moveGameToSection: (id: string, targetSection: GameSection, position?: 'top' | 'bottom') => Promise<Game>;
  clearError: () => void;
}

export type UseGamesReturn = UseGamesState & UseGamesActions;

/**
 * Hook for managing game list state and operations
 */
export function useGames(): UseGamesReturn {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize sorted games
  const sortedGames = useMemo(() => sortGames(games), [games]);

  // Load games from storage
  const loadGames = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const loadedGames = await getGames();
      setGames(loadedGames);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load games');
    } finally {
      setLoading(false);
    }
  }, []);

  // Add a new game
  const addGame = useCallback(async (input: NewGameInput): Promise<Game> => {
    setError(null);
    try {
      const newGame = await addGameService(input);
      setGames((prev) => [...prev, newGame]);
      return newGame;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add game';
      setError(message);
      throw err;
    }
  }, []);

  // Update a game
  const updateGame = useCallback(
    async (id: string, updates: Partial<Game>): Promise<Game> => {
      setError(null);
      try {
        const updatedGame = await updateGameService(id, updates);
        setGames((prev) =>
          prev.map((game) => (game.id === id ? updatedGame : game))
        );
        return updatedGame;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update game';
        setError(message);
        throw err;
      }
    },
    []
  );

  // Delete a game
  const deleteGame = useCallback(async (id: string): Promise<void> => {
    setError(null);
    try {
      await deleteGameService(id);
      setGames((prev) => prev.filter((game) => game.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete game';
      setError(message);
      throw err;
    }
  }, []);

  // Toggle completed status
  const toggleCompleted = useCallback(async (id: string): Promise<Game> => {
    setError(null);
    try {
      const updatedGame = await toggleCompletedService(id);
      setGames((prev) =>
        prev.map((game) => (game.id === id ? updatedGame : game))
      );
      return updatedGame;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to toggle completed';
      setError(message);
      throw err;
    }
  }, []);

  // Reorder games (for drag and drop)
  const reorderGames = useCallback(
    async (reorderedIds: string[]): Promise<void> => {
      setError(null);
      try {
        await reorderGamesService(reorderedIds);
        // Update sort orders in local state without full reload
        setGames((prev) => {
          const orderMap = new Map(reorderedIds.map((id, idx) => [id, idx]));
          return prev.map((game) => {
            const newOrder = orderMap.get(game.id);
            return newOrder !== undefined ? { ...game, sortOrder: newOrder } : game;
          });
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to reorder games';
        setError(message);
        throw err;
      }
    },
    []
  );

  // Reorder with Short List, To Play, and Someday Maybe sections
  const reorderWithSections = useCallback(
    async (shortListIds: string[], toPlayIds: string[], somedayMaybeIds: string[] = []): Promise<void> => {
      setError(null);
      try {
        const updatedGames = await reorderWithSectionsService(shortListIds, toPlayIds, somedayMaybeIds);
        setGames(updatedGames);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to reorder games';
        setError(message);
        throw err;
      }
    },
    []
  );

  // Toggle short list status
  const toggleShortList = useCallback(async (id: string): Promise<Game> => {
    setError(null);
    try {
      const updatedGame = await toggleShortListService(id);
      setGames((prev) =>
        prev.map((game) => (game.id === id ? updatedGame : game))
      );
      return updatedGame;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to toggle short list';
      setError(message);
      throw err;
    }
  }, []);

  // Move game to a specific section
  const moveGameToSection = useCallback(
    async (id: string, targetSection: GameSection, position: 'top' | 'bottom' = 'bottom'): Promise<Game> => {
      setError(null);
      try {
        const updatedGame = await moveGameToSectionService(id, targetSection, position);
        setGames((prev) =>
          prev.map((game) => (game.id === id ? updatedGame : game))
        );
        return updatedGame;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to move game';
        setError(message);
        throw err;
      }
    },
    []
  );

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load games on mount
  useEffect(() => {
    loadGames();
  }, [loadGames]);

  return {
    games,
    sortedGames,
    loading,
    error,
    loadGames,
    addGame,
    updateGame,
    deleteGame,
    toggleCompleted,
    reorderGames,
    reorderWithSections,
    toggleShortList,
    moveGameToSection,
    clearError,
  };
}

export default useGames;
