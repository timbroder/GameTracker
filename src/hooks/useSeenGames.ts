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
  getSeenGameNames,
  syncSeenGames,
  uploadSeenGame,
  deleteSeenGameFromCloud,
} from '../services/seenGamesSync';
import type { SeenGame } from '../types';

export interface UseSeenGamesState {
  seenGames: SeenGame[];
  seenGameIds: Map<number, Set<number>>; // platformId -> Set of rawgIds
  seenGameNamesSet: Set<string>; // lowercase game names for cross-platform filtering
  loading: boolean;
  syncing: boolean;
}

export interface UseSeenGamesActions {
  markAsSeen: (rawgId: number, platformId: number, name?: string) => Promise<SeenGame>;
  undoSeen: (rawgId: number, platformId: number) => Promise<void>;
  isGameSeen: (rawgId: number, platformId: number) => boolean;
  getSeenIdsForPlatform: (platformId: number) => Set<number>;
  getSeenNames: () => Set<string>;
  sync: () => Promise<void>;
}

export type UseSeenGamesReturn = UseSeenGamesState & UseSeenGamesActions;

export function useSeenGames(): UseSeenGamesReturn {
  const [seenGames, setSeenGames] = useState<SeenGame[]>([]);
  const [seenGameIds, setSeenGameIds] = useState<Map<number, Set<number>>>(new Map());
  const [seenGameNamesSet, setSeenGameNamesSet] = useState<Set<string>>(new Set());
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

  // Build the names set from seen games
  const buildNamesSet = useCallback((games: SeenGame[]) => {
    const names = games
      .filter((g) => g.name)
      .map((g) => g.name!.toLowerCase());
    return new Set(names);
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
        setSeenGameNamesSet(buildNamesSet(games));

        // Sync with Supabase in background
        syncSeenGames().catch(() => {});
      } catch (error) {
        if (__DEV__) console.error('[useSeenGames] Load error:', error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [buildLookupMap, buildNamesSet]);

  // Mark a game as seen (dismissed)
  const markAsSeen = useCallback(
    async (rawgId: number, platformId: number, name?: string): Promise<SeenGame> => {
      const newSeenGame = await addSeenGame(rawgId, platformId, name);

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

      // Update names set if name was provided
      if (name) {
        setSeenGameNamesSet((prev) => {
          const newSet = new Set(prev);
          newSet.add(name.toLowerCase());
          return newSet;
        });
      }

      // Upload to cloud in background
      uploadSeenGame(newSeenGame).catch(() => {});

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
    deleteSeenGameFromCloud(rawgId, platformId).catch(() => {});
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

  // Get all seen game names (lowercase)
  const getSeenNames = useCallback((): Set<string> => {
    return seenGameNamesSet;
  }, [seenGameNamesSet]);

  // Manual sync
  const sync = useCallback(async () => {
    setSyncing(true);
    try {
      await syncSeenGames();
      const games = await loadSeenGames();
      setSeenGames(games);
      setSeenGameIds(buildLookupMap(games));
      setSeenGameNamesSet(buildNamesSet(games));
    } catch (error) {
      if (__DEV__) console.error('[useSeenGames] Sync error:', error);
    } finally {
      setSyncing(false);
    }
  }, [buildLookupMap, buildNamesSet]);

  return {
    seenGames,
    seenGameIds,
    seenGameNamesSet,
    loading,
    syncing,
    markAsSeen,
    undoSeen,
    isGameSeen,
    getSeenIdsForPlatform,
    getSeenNames,
    sync,
  };
}

export default useSeenGames;
