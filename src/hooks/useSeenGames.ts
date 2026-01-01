/**
 * useSeenGames hook
 *
 * Manages seen/dismissed games for the discovery feature.
 * Tracks which games have been swiped left (dismissed) so they
 * won't be shown again.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  loadSeenGames,
  addSeenGame,
  removeSeenGame,
  getSeenGameIds,
  syncSeenGames,
  uploadSeenGame,
  deleteSeenGameFromCloud,
} from '../services/seenGamesSync';
import type { SeenGame } from '../types';

export interface UseSeenGamesState {
  seenGames: SeenGame[];
  seenGameIds: Map<number, Set<number>>; // platformId -> Set of rawgIds
  loading: boolean;
  syncing: boolean;
}

export interface UseSeenGamesActions {
  markAsSeen: (rawgId: number, platformId: number) => Promise<SeenGame>;
  undoSeen: (rawgId: number, platformId: number) => Promise<void>;
  isGameSeen: (rawgId: number, platformId: number) => boolean;
  getSeenIdsForPlatform: (platformId: number) => Set<number>;
  sync: () => Promise<void>;
}

export type UseSeenGamesReturn = UseSeenGamesState & UseSeenGamesActions;

export function useSeenGames(): UseSeenGamesReturn {
  const [seenGames, setSeenGames] = useState<SeenGame[]>([]);
  const [seenGameIds, setSeenGameIds] = useState<Map<number, Set<number>>>(new Map());
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const initializedRef = useRef(false);

  // Build the lookup map from seen games
  const buildLookupMap = useCallback((games: SeenGame[]) => {
    const map = new Map<number, Set<number>>();
    for (const game of games) {
      if (!map.has(game.platformId)) {
        map.set(game.platformId, new Set());
      }
      map.get(game.platformId)!.add(game.rawgId);
    }
    return map;
  }, []);

  // Load seen games on mount
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    async function load() {
      try {
        setLoading(true);
        const games = await loadSeenGames();
        setSeenGames(games);
        setSeenGameIds(buildLookupMap(games));

        // Sync with Supabase in background
        syncSeenGames().catch(console.error);
      } catch (error) {
        console.error('[useSeenGames] Load error:', error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [buildLookupMap]);

  // Mark a game as seen (dismissed)
  const markAsSeen = useCallback(
    async (rawgId: number, platformId: number): Promise<SeenGame> => {
      const newSeenGame = await addSeenGame(rawgId, platformId);

      // Update state
      setSeenGames((prev) => {
        const exists = prev.some(
          (g) => g.rawgId === rawgId && g.platformId === platformId
        );
        if (exists) return prev;
        return [...prev, newSeenGame];
      });

      setSeenGameIds((prev) => {
        const newMap = new Map(prev);
        if (!newMap.has(platformId)) {
          newMap.set(platformId, new Set());
        }
        newMap.get(platformId)!.add(rawgId);
        return newMap;
      });

      // Upload to cloud in background
      uploadSeenGame(newSeenGame).catch(console.error);

      return newSeenGame;
    },
    []
  );

  // Undo a seen game (for accidental swipes)
  const undoSeen = useCallback(async (rawgId: number, platformId: number) => {
    await removeSeenGame(rawgId, platformId);

    // Update state
    setSeenGames((prev) =>
      prev.filter((g) => !(g.rawgId === rawgId && g.platformId === platformId))
    );

    setSeenGameIds((prev) => {
      const newMap = new Map(prev);
      const platformSet = newMap.get(platformId);
      if (platformSet) {
        platformSet.delete(rawgId);
      }
      return newMap;
    });

    // Delete from cloud in background
    deleteSeenGameFromCloud(rawgId, platformId).catch(console.error);
  }, []);

  // Check if a game has been seen
  const isGameSeen = useCallback(
    (rawgId: number, platformId: number): boolean => {
      const platformSet = seenGameIds.get(platformId);
      return platformSet?.has(rawgId) ?? false;
    },
    [seenGameIds]
  );

  // Get all seen IDs for a platform
  const getSeenIdsForPlatform = useCallback(
    (platformId: number): Set<number> => {
      return seenGameIds.get(platformId) ?? new Set();
    },
    [seenGameIds]
  );

  // Manual sync
  const sync = useCallback(async () => {
    setSyncing(true);
    try {
      await syncSeenGames();
      const games = await loadSeenGames();
      setSeenGames(games);
      setSeenGameIds(buildLookupMap(games));
    } catch (error) {
      console.error('[useSeenGames] Sync error:', error);
    } finally {
      setSyncing(false);
    }
  }, [buildLookupMap]);

  return {
    seenGames,
    seenGameIds,
    loading,
    syncing,
    markAsSeen,
    undoSeen,
    isGameSeen,
    getSeenIdsForPlatform,
    sync,
  };
}

export default useSeenGames;
