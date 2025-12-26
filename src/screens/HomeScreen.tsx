/**
 * HomeScreen - Main screen showing the game list
 */

import React, { useCallback, useState } from 'react';
import { View, StyleSheet, Alert, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GameList, EditModal } from '../components';
import { useGames } from '../hooks';
import type { Game } from '../types';

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

  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  const handleRefresh = useCallback(async () => {
    await loadGames();
  }, [loadGames]);

  const handleReorder = useCallback(
    async (reorderedIds: string[]) => {
      try {
        await reorderGames(reorderedIds);
      } catch (err) {
        Alert.alert('Error', 'Failed to reorder games');
      }
    },
    [reorderGames]
  );

  const handleSwipe = useCallback(
    async (gameId: string) => {
      try {
        await toggleCompleted(gameId);
      } catch (err) {
        Alert.alert('Error', 'Failed to update game');
      }
    },
    [toggleCompleted]
  );

  const handleLongPress = useCallback(
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
      } catch (err) {
        Alert.alert('Error', 'Failed to delete game');
      }
    },
    [deleteGame]
  );

  const handleToggleCompletedFromModal = useCallback(
    async (gameId: string) => {
      try {
        await toggleCompleted(gameId);
      } catch (err) {
        Alert.alert('Error', 'Failed to update game');
      }
    },
    [toggleCompleted]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <GameList
        sortedGames={sortedGames}
        loading={loading}
        error={error}
        onRefresh={handleRefresh}
        onReorder={handleReorder}
        onSwipe={handleSwipe}
        onLongPress={handleLongPress}
      />
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
});

export default HomeScreen;
