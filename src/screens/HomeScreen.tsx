/**
 * HomeScreen - Main screen showing the game list with search
 */

import React, { useCallback, useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, Keyboard, LayoutAnimation } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { GameList, EditModal, SearchBar, SearchResults } from '../components';
import { useGames, useSupabaseSync } from '../hooks';
import { searchGames } from '../services/rawgApi';
import { addGame as addGameService, gameExists } from '../services/gameManager';
import type { Game, GameSearchResult, Platform } from '../types';
import type { SwipeAction } from '../components/GameRow';
import type { GameSection } from '../services/gameManager';

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const {
    games,
    sortedGames,
    loading,
    error,
    loadGames,
    toggleCompleted,
    reorderWithSections,
    toggleShortList,
    moveGameToSection,
    deleteGame,
  } = useGames();

  // Supabase sync
  const supabaseSync = useSupabaseSync({
    syncOnLaunch: true,
    syncOnForeground: true,
    onGamesUpdated: loadGames,
  });

  // Reload games when screen comes into focus (e.g., after adding from Discovery)
  useFocusEffect(
    useCallback(() => {
      loadGames();
    }, [loadGames])
  );

  // Edit modal state
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GameSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearchActive, setIsSearchActive] = useState(false);

  // Debounce timer
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Search when query changes (debounced)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      setSearchLoading(true);
      setSearchError(null);
      try {
        const results = await searchGames(searchQuery, 20);
        setSearchResults(results);
      } catch (err) {
        setSearchError(err instanceof Error ? err.message : 'Search failed');
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  // Handle adding a game from search results
  const handleSelectGame = useCallback(
    async (game: GameSearchResult, platform: Platform) => {
      try {
        // Check if game already exists
        const exists = await gameExists(game.id, platform.id);
        if (exists) {
          Alert.alert('Already Added', `${game.name} for ${platform.name} is already in your list.`);
          return;
        }

        // Add the game
        await addGameService({
          rawgId: game.id,
          name: game.name,
          platform: platform.name,
          platformId: platform.id,
          boxArtUrl: game.background_image || '',
        });

        // Refresh the game list
        await loadGames();

        // Sync to Supabase (debounced)
        supabaseSync.syncAfterChange();

        // Keep search open so user can add more games
        // Search closes when user taps Cancel
      } catch (err) {
        Alert.alert('Error', 'Failed to add game. Please try again.');
      }
    },
    [loadGames, supabaseSync]
  );

  const handleSearchFocus = useCallback(() => {
    setIsSearchActive(true);
  }, []);

  const handleSearchCancel = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchError(null);
    setIsSearchActive(false);
    Keyboard.dismiss();
  }, []);

  const handleReorder = useCallback(
    async (shortListIds: string[], toPlayIds: string[], somedayMaybeIds: string[]) => {
      try {
        await reorderWithSections(shortListIds, toPlayIds, somedayMaybeIds);
        supabaseSync.syncAfterChange();
      } catch (err) {
        Alert.alert('Error', 'Failed to reorder games');
      }
    },
    [reorderWithSections, supabaseSync]
  );

  /**
   * Determine the current section of a game
   */
  const getGameSection = useCallback((game: Game): GameSection => {
    if (game.isCompleted) return 'completed';
    if (game.isShortListed) return 'shortList';
    if (game.isSomedayMaybe) return 'somedayMaybe';
    return 'toPlay';
  }, []);

  /**
   * Section promotion order: completed -> somedayMaybe -> toPlay -> shortList
   * moveUp1 = one step up, moveUp2 = two steps up
   */
  const sectionOrder: GameSection[] = ['completed', 'somedayMaybe', 'toPlay', 'shortList'];

  const handleSwipe = useCallback(
    async (gameId: string, action: SwipeAction) => {
      try {
        const game = games.find((g) => g.id === gameId);
        if (!game) return;

        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

        if (action === 'completed') {
          await toggleCompleted(gameId);
          supabaseSync.syncAfterChange();
          return;
        }

        const currentSection = getGameSection(game);
        const currentIdx = sectionOrder.indexOf(currentSection);

        if (action === 'moveUp1' || action === 'moveUp2') {
          // Promote: move up in section order
          const steps = action === 'moveUp1' ? 1 : 2;
          const targetIdx = Math.min(currentIdx + steps, sectionOrder.length - 1);
          const targetSection = sectionOrder[targetIdx];

          if (targetSection === 'shortList' && sortedGames.shortList.length >= 5) {
            Alert.alert('Short List Full', 'Remove a game from the Short List first (max 5).');
            return;
          }

          await moveGameToSection(gameId, targetSection, 'bottom');
        } else {
          // Demote: move down in section order (moveDown1 / moveDown2)
          const steps = action === 'moveDown1' ? 1 : 2;
          const targetIdx = Math.max(currentIdx - steps, 0);
          const targetSection = sectionOrder[targetIdx];

          await moveGameToSection(gameId, targetSection, 'top');
        }

        supabaseSync.syncAfterChange();
      } catch (err) {
        Alert.alert('Error', 'Failed to update game');
      }
    },
    [games, toggleCompleted, moveGameToSection, getGameSection, supabaseSync, sortedGames.shortList.length]
  );

  const handleInfo = useCallback(
    (gameId: string) => {
      const game = games.find((g) => g.id === gameId);
      if (game) {
        setEditingGame(game);
        setIsEditModalVisible(true);
      }
    },
    [games]
  );

  const handleCloseEditModal = useCallback(() => {
    setIsEditModalVisible(false);
    setEditingGame(null);
  }, []);

  const handleDeleteGame = useCallback(
    async (gameId: string) => {
      try {
        await deleteGame(gameId);
        supabaseSync.syncAfterChange();
      } catch (err) {
        Alert.alert('Error', 'Failed to delete game');
      }
    },
    [deleteGame, supabaseSync]
  );

  const handleToggleCompletedFromModal = useCallback(
    async (gameId: string) => {
      try {
        await toggleCompleted(gameId);
        supabaseSync.syncAfterChange();
      } catch (err) {
        Alert.alert('Error', 'Failed to update game');
      }
    },
    [toggleCompleted, supabaseSync]
  );

  const handleToggleSomedayMaybe = useCallback(
    async (gameId: string) => {
      try {
        const game = games.find((g) => g.id === gameId);
        if (!game) return;
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        const targetSection = game.isSomedayMaybe ? 'toPlay' : 'somedayMaybe';
        await moveGameToSection(gameId, targetSection as GameSection);
        supabaseSync.syncAfterChange();
      } catch (err) {
        Alert.alert('Error', 'Failed to update game');
      }
    },
    [games, moveGameToSection, supabaseSync]
  );

  const handleToggleShortList = useCallback(
    async (gameId: string) => {
      try {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        await toggleShortList(gameId);
        supabaseSync.syncAfterChange();
      } catch (err) {
        Alert.alert('Error', 'Failed to update short list');
      }
    },
    [toggleShortList, supabaseSync]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Game list */}
      <GameList
        sortedGames={sortedGames}
        loading={loading}
        error={error}
        onReorder={handleReorder}
        onSwipe={handleSwipe}
        onInfo={handleInfo}
        onRetry={loadGames}
      />

      {/* Search results overlay */}
      <SearchResults
        visible={isSearchActive}
        results={searchResults}
        loading={searchLoading}
        error={searchError}
        onSelectGame={handleSelectGame}
        onClose={handleSearchCancel}
      />

      {/* Persistent search bar */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        onFocus={handleSearchFocus}
        onCancel={handleSearchCancel}
        isActive={isSearchActive}
      />

      {/* Edit modal */}
      <EditModal
        game={editingGame}
        visible={isEditModalVisible}
        shortListCount={sortedGames.shortList.length}
        onClose={handleCloseEditModal}
        onDelete={handleDeleteGame}
        onToggleCompleted={handleToggleCompletedFromModal}
        onToggleShortList={handleToggleShortList}
        onToggleSomedayMaybe={handleToggleSomedayMaybe}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});

export default HomeScreen;
