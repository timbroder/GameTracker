/**
 * SwipeDeck - Manages a stack of swipeable game cards
 *
 * Features:
 * - Renders a stack of 3 visible cards
 * - Handles card transitions when swiped
 * - Triggers load more when running low on cards
 */

import React, { memo, useCallback } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SwipeCard } from './SwipeCard';
import type { DiscoveryGame } from '../types';

const VISIBLE_CARDS = 3;

export interface SwipeDeckProps {
  games: DiscoveryGame[];
  onSwipeLeft: (game: DiscoveryGame) => void;
  onSwipeRight: (game: DiscoveryGame) => void;
  onNeedMore: () => void;
  loading?: boolean;
}

function SwipeDeckComponent({
  games,
  onSwipeLeft,
  onSwipeRight,
  onNeedMore,
  loading = false,
}: SwipeDeckProps) {
  // Take only visible cards
  const visibleGames = games.slice(0, VISIBLE_CARDS);

  const handleSwipeLeft = useCallback(
    (game: DiscoveryGame) => {
      onSwipeLeft(game);
      // Check if we need to load more
      if (games.length <= VISIBLE_CARDS + 2) {
        onNeedMore();
      }
    },
    [games.length, onSwipeLeft, onNeedMore]
  );

  const handleSwipeRight = useCallback(
    (game: DiscoveryGame) => {
      onSwipeRight(game);
      // Check if we need to load more
      if (games.length <= VISIBLE_CARDS + 2) {
        onNeedMore();
      }
    },
    [games.length, onSwipeRight, onNeedMore]
  );

  // No cards left
  if (visibleGames.length === 0 && !loading) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🎉</Text>
        <Text style={styles.emptyText}>All caught up!</Text>
        <Text style={styles.emptySubtext}>
          You've seen all games for this platform
        </Text>
      </View>
    );
  }

  // Loading state when no cards
  if (visibleGames.length === 0 && loading) {
    return (
      <View style={styles.emptyContainer}>
        <ActivityIndicator size="large" color="#4D96FF" />
        <Text style={styles.loadingText}>Loading games...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Render cards in reverse order so top card is last (on top in z-order) */}
      {visibleGames
        .slice()
        .reverse()
        .map((game, reversedIndex) => {
          const index = visibleGames.length - 1 - reversedIndex;
          const isTop = index === 0;

          return (
            <Animated.View
              key={game.id}
              entering={FadeIn.duration(200)}
              style={[
                styles.cardWrapper,
                {
                  // Stack cards with slight offset
                  transform: [
                    { scale: 1 - index * 0.03 },
                    { translateY: index * -8 },
                  ],
                  zIndex: VISIBLE_CARDS - index,
                },
              ]}
            >
              <SwipeCard
                game={game}
                onSwipeLeft={handleSwipeLeft}
                onSwipeRight={handleSwipeRight}
                isTopCard={isTop}
              />
            </Animated.View>
          );
        })}

      {/* Loading indicator at bottom when fetching more */}
      {loading && visibleGames.length > 0 && (
        <View style={styles.loadingMore}>
          <ActivityIndicator size="small" color="#666" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardWrapper: {
    position: 'absolute',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#888',
    marginTop: 16,
  },
  loadingMore: {
    position: 'absolute',
    bottom: 20,
  },
});

export const SwipeDeck = memo(SwipeDeckComponent);
export default SwipeDeck;
