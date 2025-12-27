/**
 * GameList - Main game list component with drag-and-drop support
 *
 * Unplayed games can be reordered via drag-and-drop.
 * Completed games are shown in a separate non-draggable section.
 */

import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import DraggableFlatList, {
  RenderItemParams,
} from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import type { Game } from '../types';
import { GameRow } from './GameRow';
import { SkeletonLoader } from './SkeletonRow';
import type { SortedGames } from '../utils/sorting';

const SKELETON_COUNT = 6;

export interface GameListProps {
  sortedGames: SortedGames;
  loading: boolean;
  error: string | null;
  onReorder: (reorderedIds: string[]) => Promise<void>;
  onSwipe: (gameId: string) => Promise<void>;
  onInfo?: (gameId: string) => void;
  onRetry?: () => void;
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
 * Error state component with retry button
 */
function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>Tap to Retry</Text>
        </TouchableOpacity>
      )}
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
  onRetry,
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

  // Footer component with completed games
  const ListFooter = useMemo(() => {
    if (completed.length === 0) return null;
    return (
      <View style={styles.footerContainer}>
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
    );
  }, [completed, onSwipe, onInfo]);

  // Loading state - show skeleton while loading initial data
  if (loading && unplayed.length === 0 && completed.length === 0) {
    return (
      <View style={styles.container}>
        <SkeletonLoader count={SKELETON_COUNT} />
      </View>
    );
  }

  // Error state
  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  // Empty state
  if (unplayed.length === 0 && completed.length === 0) {
    return (
      <EmptyState message="No games yet. Tap + to add your first game!" />
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <DraggableFlatList
        data={unplayed}
        keyExtractor={keyExtractor}
        renderItem={renderUnplayedItem}
        onDragEnd={handleDragEnd}
        ListFooterComponent={ListFooter}
        ListEmptyComponent={
          completed.length > 0 ? null : (
            <EmptyState message="No games to play!" />
          )
        }
        contentContainerStyle={styles.listContent}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  listContent: {
    paddingBottom: 100, // Space for search bar
  },
  footerContainer: {
    marginTop: 8,
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
  retryButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#333',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
