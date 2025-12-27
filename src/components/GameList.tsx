/**
 * GameList - Main game list component with drag-and-drop support
 *
 * Unplayed games can be reordered via drag-and-drop.
 * Completed games are shown in a separate non-draggable section.
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  ScrollView,
} from 'react-native';
import DraggableFlatList, {
  RenderItemParams,
} from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import type { Game } from '../types';
import { GameRow } from './GameRow';
import type { SortedGames } from '../utils/sorting';

export interface GameListProps {
  sortedGames: SortedGames;
  loading: boolean;
  error: string | null;
  onReorder: (reorderedIds: string[]) => Promise<void>;
  onSwipe: (gameId: string) => Promise<void>;
  onInfo?: (gameId: string) => void;
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
  onReorder,
  onSwipe,
  onInfo,
}: GameListProps) {
  const { unplayed, completed } = sortedGames;

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
        <Pressable onLongPress={drag} delayLongPress={200}>
          <GameRow
            game={item}
            onSwipe={onSwipe}
            onInfo={onInfo}
            isDragging={isActive}
          />
        </Pressable>
      );
    },
    [onSwipe, onInfo]
  );

  const keyExtractor = useCallback((item: Game) => item.id, []);

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
      <EmptyState message="No games yet. Tap + to add your first game!" />
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Unplayed games - draggable */}
        {unplayed.length > 0 && (
          <DraggableFlatList
            data={unplayed}
            keyExtractor={keyExtractor}
            renderItem={renderUnplayedItem}
            onDragEnd={handleDragEnd}
            scrollEnabled={false}
          />
        )}

        {/* Completed games - not draggable */}
        {completed.length > 0 && (
          <View>
            <SectionHeader title="Completed" count={completed.length} />
            {completed.map((game) => (
              <GameRow
                key={game.id}
                game={game}
                onSwipe={onSwipe}
                onInfo={onInfo}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
