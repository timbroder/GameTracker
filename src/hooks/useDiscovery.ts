/**
 * useDiscovery hook
 *
 * Manages the discovery flow state machine:
 * platform_selection -> loading -> swiping -> (empty | error)
 */

import { useState, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { getGamesByPlatform } from '../services/rawgApi';
import { addGameAsCompleted, isGameInCollection } from '../services/discoveryService';
import { useSeenGames } from './useSeenGames';
import { useHaptics } from './useHaptics';
import type { LegacyPlatform, DiscoveryGame, DiscoveryState } from '../types';

const PAGE_SIZE = 40;
const LOAD_MORE_THRESHOLD = 5;

interface UndoAction {
  type: 'left' | 'right';
  game: DiscoveryGame;
  platform: LegacyPlatform;
}

export interface UseDiscoveryReturn {
  // State
  state: DiscoveryState;
  selectedPlatform: LegacyPlatform | null;
  games: DiscoveryGame[];
  loading: boolean;
  canUndo: boolean;

  // Actions
  selectPlatform: (platform: LegacyPlatform) => void;
  goBack: () => void;
  handleSwipeLeft: (game: DiscoveryGame) => void;
  handleSwipeRight: (game: DiscoveryGame) => void;
  undo: () => void;
  loadMore: () => void;
}

export function useDiscovery(): UseDiscoveryReturn {
  const haptics = useHaptics();
  const seenGames = useSeenGames();

  const [state, setState] = useState<DiscoveryState>('platform_selection');
  const [selectedPlatform, setSelectedPlatform] = useState<LegacyPlatform | null>(null);
  const [games, setGames] = useState<DiscoveryGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastAction, setLastAction] = useState<UndoAction | null>(null);

  // Pagination tracking
  const currentPageRef = useRef(1);
  const hasMoreRef = useRef(true);
  const totalGamesRef = useRef(0);

  /**
   * Filter out games that have been seen or are already in collection
   */
  const filterGames = useCallback(
    async (
      rawGames: Array<{
        id: number;
        name: string;
        background_image: string | null;
        released: string | null;
        genres: Array<{ id: number; name: string }>;
      }>,
      platformId: number
    ): Promise<DiscoveryGame[]> => {
      const seenIds = seenGames.getSeenIdsForPlatform(platformId);

      const filtered: DiscoveryGame[] = [];
      for (const game of rawGames) {
        // Skip if seen
        if (seenIds.has(game.id)) continue;

        // Skip if already in collection
        const inCollection = await isGameInCollection(game.id, platformId);
        if (inCollection) continue;

        filtered.push({
          id: game.id,
          name: game.name,
          backgroundImage: game.background_image,
          released: game.released,
          genres: game.genres.map((g) => g.name),
        });
      }

      return filtered;
    },
    [seenGames]
  );

  /**
   * Load games for a platform
   */
  const loadGames = useCallback(
    async (platform: LegacyPlatform, page: number = 1) => {
      try {
        setLoading(true);

        const response = await getGamesByPlatform(platform.id, page, PAGE_SIZE);
        totalGamesRef.current = response.count;
        hasMoreRef.current = response.next !== null;
        currentPageRef.current = page;

        const filteredGames = await filterGames(response.results, platform.id);

        if (page === 1) {
          setGames(filteredGames);
        } else {
          setGames((prev) => [...prev, ...filteredGames]);
        }

        // If we filtered out everything and there's more, load next page
        if (filteredGames.length === 0 && response.next) {
          await loadGames(platform, page + 1);
          return;
        }

        // Check if we have any games left
        if (filteredGames.length === 0 && !response.next) {
          setState('empty');
        } else {
          setState('swiping');
        }
      } catch (error) {
        console.error('[useDiscovery] Load error:', error);
        setState('error');
      } finally {
        setLoading(false);
      }
    },
    [filterGames]
  );

  /**
   * Select a platform and start loading games
   */
  const selectPlatform = useCallback(
    (platform: LegacyPlatform) => {
      setSelectedPlatform(platform);
      setState('loading');
      currentPageRef.current = 1;
      hasMoreRef.current = true;
      setGames([]);
      setLastAction(null);
      loadGames(platform, 1);
    },
    [loadGames]
  );

  /**
   * Go back to platform selection
   */
  const goBack = useCallback(() => {
    setSelectedPlatform(null);
    setState('platform_selection');
    setGames([]);
    setLastAction(null);
  }, []);

  /**
   * Handle swipe left (dismiss)
   */
  const handleSwipeLeft = useCallback(
    async (game: DiscoveryGame) => {
      if (!selectedPlatform) return;

      haptics.light();

      // Mark as seen
      await seenGames.markAsSeen(game.id, selectedPlatform.id);

      // Save for undo
      setLastAction({ type: 'left', game, platform: selectedPlatform });

      // Remove from deck
      setGames((prev) => prev.filter((g) => g.id !== game.id));

      // Check if empty
      if (games.length <= 1 && !hasMoreRef.current) {
        setState('empty');
      }
    },
    [selectedPlatform, seenGames, haptics, games.length]
  );

  /**
   * Handle swipe right (add to collection)
   */
  const handleSwipeRight = useCallback(
    async (game: DiscoveryGame) => {
      if (!selectedPlatform) return;

      haptics.medium();

      try {
        // Add to collection as completed
        await addGameAsCompleted(game, selectedPlatform);

        // Also mark as seen so it doesn't show again
        await seenGames.markAsSeen(game.id, selectedPlatform.id);

        // Save for undo
        setLastAction({ type: 'right', game, platform: selectedPlatform });

        // Remove from deck
        setGames((prev) => prev.filter((g) => g.id !== game.id));

        // Check if empty
        if (games.length <= 1 && !hasMoreRef.current) {
          setState('empty');
        }
      } catch (error) {
        if (error instanceof Error && error.message === 'Game already in collection') {
          Alert.alert('Already Added', `${game.name} is already in your collection.`);
        } else {
          Alert.alert('Error', 'Failed to add game. Please try again.');
        }
      }
    },
    [selectedPlatform, seenGames, haptics, games.length]
  );

  /**
   * Undo last action
   */
  const undo = useCallback(async () => {
    if (!lastAction || !selectedPlatform) return;

    haptics.light();

    const { type, game, platform } = lastAction;

    // Remove from seen games
    await seenGames.undoSeen(game.id, platform.id);

    // If it was added to collection, we'd need to remove it
    // For now, just remove from seen so it appears again in discovery
    // The game in collection stays (user can delete manually if needed)

    // Add back to front of deck
    setGames((prev) => [game, ...prev]);

    // Clear undo
    setLastAction(null);

    // Make sure we're in swiping state
    if (state === 'empty') {
      setState('swiping');
    }
  }, [lastAction, selectedPlatform, seenGames, haptics, state]);

  /**
   * Load more games
   */
  const loadMore = useCallback(() => {
    if (loading || !hasMoreRef.current || !selectedPlatform) return;

    const nextPage = currentPageRef.current + 1;
    loadGames(selectedPlatform, nextPage);
  }, [loading, selectedPlatform, loadGames]);

  return {
    state,
    selectedPlatform,
    games,
    loading,
    canUndo: lastAction !== null,
    selectPlatform,
    goBack,
    handleSwipeLeft,
    handleSwipeRight,
    undo,
    loadMore,
  };
}

export default useDiscovery;
