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
import { GameRow, GAME_ROW_HEIGHT } from './GameRow';
import { SkeletonLoader } from './SkeletonRow';
import type { SortedGames } from '../utils/sorting';

/**
 * FlatList performance configuration
 */
const LIST_PERFORMANCE_CONFIG = {
  // Pre-calculate item layout for faster scrolling
  getItemLayout: (_data: ArrayLike<Game> | null | undefined, index: number) => ({
    length: GAME_ROW_HEIGHT,
    offset: GAME_ROW_HEIGHT * index,
    index,
  }),
  // Remove offscreen views to save memory
  removeClippedSubviews: true,
  // Render fewer items per batch for smoother scrolling
  maxToRenderPerBatch: 10,
  // Reduce initial render batch
  initialNumToRender: 10,
  // Window size (number of items to keep in memory)
  windowSize: 11,
  // Update cell batch size
  updateCellsBatchingPeriod: 50,
};

const SKELETON_COUNT = 6;

export interface GameListProps {
  sortedGames: SortedGames;
  loading: boolean;
  error: string | null;
  onReorder: (shortListIds: string[], toPlayIds: string[]) => Promise<void>;
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
/**
 * Section header for Short List showing count out of max 5
 */
function ShortListHeader({ count }: { count: number }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>
        SHORT LIST ({count}/5)
      </Text>
      {count === 0 && (
        <Text style={styles.sectionHint}>
          Tap i on a game to add it here
        </Text>
      )}
    </View>
  );
}

const MAX_SHORT_LIST = 5;

export function GameList({
  sortedGames,
  loading,
  error,
  onReorder,
  onSwipe,
  onInfo,
  onRetry,
}: GameListProps) {
  const { shortList, unplayed, completed } = sortedGames;

  // Combine short list and unplayed into single draggable array
  const combinedData = useMemo(
    () => [...shortList, ...unplayed],
    [shortList, unplayed]
  );

  const shortListCount = shortList.length;
  const unplayedCount = unplayed.length;

  const handleDragEnd = useCallback(
    ({ data, from, to }: { data: Game[]; from: number; to: number }) => {
      const oldBoundary = shortListCount;
      let newBoundary = oldBoundary;

      if (from >= oldBoundary && to < oldBoundary) {
        // To Play → Short List
        newBoundary = Math.min(oldBoundary + 1, MAX_SHORT_LIST);
      } else if (from < oldBoundary && to >= oldBoundary) {
        // Short List → To Play
        newBoundary = Math.max(oldBoundary - 1, 0);
      }

      // Cap at 5: if boundary exceeds max, clamp it
      newBoundary = Math.min(newBoundary, MAX_SHORT_LIST);

      const shortListIds = data.slice(0, newBoundary).map((g) => g.id);
      const toPlayIds = data.slice(newBoundary).map((g) => g.id);
      onReorder(shortListIds, toPlayIds);
    },
    [onReorder, shortListCount]
  );

  const renderItem = useCallback(
    ({ item, getIndex, drag, isActive }: RenderItemParams<Game>) => {
      const flatIndex = getIndex() ?? 0;
      const isInShortList = flatIndex < shortListCount;

      // Section-local index and total for gradient positioning
      const sectionIndex = isInShortList
        ? flatIndex
        : flatIndex - shortListCount;
      const sectionTotal = isInShortList ? shortListCount : unplayedCount;
      const section = isInShortList ? 'shortList' : 'toPlay';

      // Determine if we need a section header above this item
      let header = null;
      if (flatIndex === shortListCount && unplayedCount > 0) {
        header = <SectionHeader title="To Play" count={unplayedCount} />;
      }

      return (
        <>
          {header}
          <Pressable onLongPress={drag} delayLongPress={200}>
            <GameRow
              game={item}
              index={sectionIndex}
              totalCount={sectionTotal}
              section={section}
              onSwipe={onSwipe}
              onInfo={onInfo}
              isDragging={isActive}
            />
          </Pressable>
        </>
      );
    },
    [onSwipe, onInfo, shortListCount, unplayedCount]
  );

  const keyExtractor = useCallback((item: Game) => item.id, []);

  // Footer component with completed games
  const completedCount = completed.length;
  const ListFooter = useMemo(() => {
    if (completedCount === 0) return null;
    return (
      <View style={styles.footerContainer}>
        <SectionHeader title="Completed" count={completedCount} />
        {completed.map((game, index) => (
          <GameRow
            key={game.id}
            game={game}
            index={index}
            totalCount={completedCount}
            section="completed"
            onSwipe={onSwipe}
            onInfo={onInfo}
          />
        ))}
      </View>
    );
  }, [completed, completedCount, onSwipe, onInfo]);

  // Loading state - show skeleton while loading initial data
  if (loading && shortList.length === 0 && unplayed.length === 0 && completed.length === 0) {
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
  if (shortList.length === 0 && unplayed.length === 0 && completed.length === 0) {
    return (
      <EmptyState message="No games yet. Tap + to add your first game!" />
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <DraggableFlatList
        data={combinedData}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        onDragEnd={handleDragEnd}
        ListHeaderComponent={<ShortListHeader count={shortListCount} />}
        ListFooterComponent={ListFooter}
        ListEmptyComponent={
          completed.length > 0 ? (
            <SectionHeader title="To Play" count={0} />
          ) : (
            <EmptyState message="No games to play!" />
          )
        }
        contentContainerStyle={styles.listContent}
        // Performance optimizations (without getItemLayout since headers vary height)
        removeClippedSubviews={LIST_PERFORMANCE_CONFIG.removeClippedSubviews}
        maxToRenderPerBatch={LIST_PERFORMANCE_CONFIG.maxToRenderPerBatch}
        initialNumToRender={LIST_PERFORMANCE_CONFIG.initialNumToRender}
        windowSize={LIST_PERFORMANCE_CONFIG.windowSize}
        updateCellsBatchingPeriod={LIST_PERFORMANCE_CONFIG.updateCellsBatchingPeriod}
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
  sectionHint: {
    color: '#555',
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
});

export default GameList;
