/**
 * useRawgIdMatcher - Hook for matching games without RAWG IDs
 *
 * Manages the workflow of stepping through unmatched games,
 * searching RAWG, and linking results.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Game, GameSearchResult } from '../types';
import * as gameManager from '../services/gameManager';
import { searchGames } from '../services/rawgApi';

export interface UseRawgIdMatcherReturn {
  unmatchedGames: Game[];
  currentGame: Game | null;
  currentIndex: number;
  totalCount: number;
  matchedCount: number;
  skippedCount: number;
  searchQuery: string;
  searchResults: GameSearchResult[];
  isLoading: boolean;
  isSearching: boolean;
  isDone: boolean;
  setSearchQuery: (query: string) => void;
  matchGame: (result: GameSearchResult) => Promise<void>;
  skipGame: () => void;
  loadGames: () => Promise<void>;
}

export function useRawgIdMatcher(): UseRawgIdMatcherReturn {
  const [unmatchedGames, setUnmatchedGames] = useState<Game[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchedCount, setMatchedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GameSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentGame = currentIndex < unmatchedGames.length
    ? unmatchedGames[currentIndex]
    : null;

  const isDone = !isLoading && (unmatchedGames.length === 0 || currentIndex >= unmatchedGames.length);

  const loadGames = useCallback(async () => {
    setIsLoading(true);
    try {
      const allGames = await gameManager.getGames();
      const unmatched = allGames.filter(g => g.rawgId === 0);
      setUnmatchedGames(unmatched);
      setCurrentIndex(0);
      setMatchedCount(0);
      setSkippedCount(0);
      if (unmatched.length > 0) {
        setSearchQuery(unmatched[0].name);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-search when searchQuery changes (debounced)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchGames(searchQuery, 10);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery]);

  // When currentGame changes, update search query to game name
  useEffect(() => {
    if (currentGame) {
      setSearchQuery(currentGame.name);
      setSearchResults([]);
    }
  }, [currentGame]);

  const advance = useCallback(() => {
    setCurrentIndex(prev => prev + 1);
  }, []);

  const matchGame = useCallback(async (result: GameSearchResult) => {
    if (!currentGame) return;

    await gameManager.updateGame(currentGame.id, {
      rawgId: result.id,
      boxArtUrl: result.background_image || '',
    });

    setMatchedCount(prev => prev + 1);
    advance();
  }, [currentGame, advance]);

  const skipGame = useCallback(() => {
    setSkippedCount(prev => prev + 1);
    advance();
  }, [advance]);

  return {
    unmatchedGames,
    currentGame,
    currentIndex,
    totalCount: unmatchedGames.length,
    matchedCount,
    skippedCount,
    searchQuery,
    searchResults,
    isLoading,
    isSearching,
    isDone,
    setSearchQuery,
    matchGame,
    skipGame,
    loadGames,
  };
}
