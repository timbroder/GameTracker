/**
 * GameList - Main game list component with drag-and-drop support
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import type { Game } from '../types';
import { GameRow, GAME_ROW_HEIGHT } from './GameRow';
import type { SortedGames } from '../utils/sorting';

export interface GameListProps {
  sortedGames: SortedGames;
  loading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
  onReorder: (reorderedIds: string[]) => Promise<void>;
  onSwipe: (gameId: string) => Promise<void>;
  onLongPress?: (gameId: string) => void;
  onPinch?: (gameId: string) => void;
}

/**
 * Empty state component
 */
function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>{message}</Text>
    </View>
  );
}

/**
 * Section header component
 */
function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>
        {title} ({count})
      </Text>
    </View>
  );
}

/**
 * Loading state component
 */
function LoadingState() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#4D96FF" />
      <Text style={styles.loadingText}>Loading games...</Text>
    </View>
  );
}

/**
 * Error state component
 */
function ErrorState({ message }: { message: string }) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

/**
 * GameList component
 */
export function GameList({
  sortedGames,
  loading,
  error,
  onRefresh,
  onReorder,
  onSwipe,
  onLongPress,
  onPinch,
}: GameListProps) {
  const { unplayed, completed } = sortedGames;
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  const handleDragEnd = useCallback(
    ({ data }: { data: Game[] }) => {
      const reorderedIds = data.map((game) => game.id);
      onReorder(reorderedIds);
    },
    [onReorder]
  );

  const renderUnplayedItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<Game>) => {
      return (
        <ScaleDecorator>
          <GameRow
            game={item}
            onSwipe={onSwipe}
            onLongPress={onLongPress}
            onPinch={onPinch}
          />
        </ScaleDecorator>
      );
    },
    [onSwipe, onLongPress, onPinch]
  );

  const renderCompletedItem = useCallback(
    (game: Game) => {
      return (
        <GameRow
          key={game.id}
          game={game}
          onSwipe={onSwipe}
          onLongPress={onLongPress}
          onPinch={onPinch}
        />
      );
    },
    [onSwipe, onLongPress, onPinch]
  );

  const keyExtractor = useCallback((item: Game) => item.id, []);

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: GAME_ROW_HEIGHT,
      offset: GAME_ROW_HEIGHT * index,
      index,
    }),
    []
  );

  // Loading state
  if (loading && unplayed.length === 0 && completed.length === 0) {
    return <LoadingState />;
  }

  // Error state
  if (error) {
    return <ErrorState message={error} />;
  }

  // Empty state
  if (unplayed.length === 0 && completed.length === 0) {
    return (
      <EmptyState message="No games yet. Pull down to add your first game!" />
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.container}>
        {/* Unplayed Games Section */}
        {unplayed.length > 0 ? (
          <DraggableFlatList
            data={unplayed}
            keyExtractor={keyExtractor}
            renderItem={renderUnplayedItem}
            onDragEnd={handleDragEnd}
            getItemLayout={getItemLayout}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#4D96FF"
              />
            }
            ListFooterComponent={
              completed.length > 0 ? (
                <View>
                  <SectionHeader title="Completed" count={completed.length} />
                  {completed.map(renderCompletedItem)}
                </View>
              ) : null
            }
          />
        ) : (
          <View style={styles.container}>
            <EmptyState message="No games to play. All done!" />
            {completed.length > 0 && (
              <>
                <SectionHeader title="Completed" count={completed.length} />
                {completed.map(renderCompletedItem)}
              </>
            )}
          </View>
        )}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    marginTop: 12,
    color: '#888',
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    textAlign: 'center',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  sectionHeader: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#111',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  sectionHeaderText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

export default GameList;
