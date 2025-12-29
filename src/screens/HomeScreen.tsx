/**
 * HomeScreen - Main screen showing the game list with search
 */

import React, { useCallback, useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GameList, EditModal, SearchBar, SearchResults, SyncIndicator } from '../components';
import { useGames, useICloudSync } from '../hooks';
import { searchGames } from '../services/rawgApi';
import { addGame as addGameService, gameExists } from '../services/gameManager';
import type { Game, GameSearchResult, Platform } from '../types';

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const {
    games,
    sortedGames,
    loading,
    error,
    loadGames,
    toggleCompleted,
    reorderGames,
    deleteGame,
  } = useGames();

  // iCloud sync
  const iCloudSync = useICloudSync({
    syncOnLaunch: true,
    syncOnForeground: true,
    onGamesUpdated: loadGames,
  });

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

        // Sync to iCloud (debounced)
        iCloudSync.syncAfterChange();

        // Close search
        setSearchQuery('');
        setSearchResults([]);
        setIsSearchActive(false);
        Keyboard.dismiss();
      } catch (err) {
        Alert.alert('Error', 'Failed to add game. Please try again.');
      }
    },
    [loadGames, iCloudSync]
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
    async (reorderedIds: string[]) => {
      try {
        await reorderGames(reorderedIds);
        iCloudSync.syncAfterChange();
      } catch (err) {
        Alert.alert('Error', 'Failed to reorder games');
      }
    },
    [reorderGames, iCloudSync]
  );

  const handleSwipe = useCallback(
    async (gameId: string) => {
      try {
        await toggleCompleted(gameId);
        iCloudSync.syncAfterChange();
      } catch (err) {
        Alert.alert('Error', 'Failed to update game');
      }
    },
    [toggleCompleted, iCloudSync]
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
        iCloudSync.syncAfterChange();
      } catch (err) {
        Alert.alert('Error', 'Failed to delete game');
      }
    },
    [deleteGame, iCloudSync]
  );

  const handleToggleCompletedFromModal = useCallback(
    async (gameId: string) => {
      try {
        await toggleCompleted(gameId);
        iCloudSync.syncAfterChange();
      } catch (err) {
        Alert.alert('Error', 'Failed to update game');
      }
    },
    [toggleCompleted, iCloudSync]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Sync indicator header */}
      <View style={styles.header}>
        <SyncIndicator
          isAvailable={iCloudSync.isAvailable}
          isSyncing={iCloudSync.isSyncing}
          lastSyncTime={iCloudSync.lastSyncTime}
          lastSyncSuccess={iCloudSync.lastSyncSuccess}
          lastSyncMessage={iCloudSync.lastSyncMessage}
          availabilityMessage={iCloudSync.availabilityMessage}
          sync={iCloudSync.sync}
        />
      </View>

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
        onClose={handleCloseEditModal}
        onDelete={handleDeleteGame}
        onToggleCompleted={handleToggleCompletedFromModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});

export default HomeScreen;
