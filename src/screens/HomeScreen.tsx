/**
 * HomeScreen - Main screen showing the game list
 */

import React, { useCallback } from 'react';
import { SafeAreaView, StyleSheet, Alert } from 'react-native';
import { GameList } from '../components';
import { useGames } from '../hooks';

export function HomeScreen() {
  const {
    sortedGames,
    loading,
    error,
    loadGames,
    toggleCompleted,
    reorderGames,
    deleteGame,
  } = useGames();

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

  const handleLongPress = useCallback((gameId: string) => {
    // TODO: Open edit modal in Phase 5
    console.log('Long press on game:', gameId);
  }, []);

  const handlePinch = useCallback(
    (gameId: string) => {
      // TODO: Better delete confirmation in Phase 5
      Alert.alert(
        'Delete Game',
        'Are you sure you want to delete this game?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteGame(gameId);
              } catch (err) {
                Alert.alert('Error', 'Failed to delete game');
              }
            },
          },
        ]
      );
    },
    [deleteGame]
  );

  return (
    <SafeAreaView style={styles.container}>
      <GameList
        sortedGames={sortedGames}
        loading={loading}
        error={error}
        onRefresh={handleRefresh}
        onReorder={handleReorder}
        onSwipe={handleSwipe}
        onLongPress={handleLongPress}
        onPinch={handlePinch}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});

export default HomeScreen;
