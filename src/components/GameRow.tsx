/**
 * GameRow - Clear-style game row component with gestures
 *
 * Displays a single game with gradient background, box art, and platform info.
 * Supports:
 * - Swipe right to toggle completed status
 * - Long press to edit
 * - Completed state with grey coloring
 */

import React, { memo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  FadeIn,
  FadeOut,
  Layout,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import type { Game } from '../types';
import {
  getGradientProps,
  getPositionalGreen,
  getPositionalGrey,
} from '../utils/colors';
import { useHaptics } from '../hooks/useHaptics';

/**
 * Format completed date for display
 */
function formatCompletedDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Format as MM/DD/YYYY
  const dateStr = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;

  if (diffDays === 0) return `today (${dateStr})`;
  if (diffDays === 1) return `yesterday (${dateStr})`;
  if (diffDays < 7) return `${diffDays} days ago (${dateStr})`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? `1 week ago (${dateStr})` : `${weeks} weeks ago (${dateStr})`;
  }

  // Just show the date for older completions
  return dateStr;
}

export interface GameRowProps {
  game: Game;
  index: number;      // Position in the list (0-based)
  totalCount: number; // Total items in this section
  onSwipe?: (gameId: string) => void;
  onInfo?: (gameId: string) => void;
  isDragging?: boolean;
}

/**
 * Row height - sized to fit box art with padding
 */
export const GAME_ROW_HEIGHT = 88;

/**
 * Swipe threshold to trigger action (lowered for better responsiveness)
 */
const SWIPE_THRESHOLD = 60;

/**
 * Placeholder component for missing box art
 */
function BoxArtPlaceholder() {
  return (
    <View style={[styles.boxArt, styles.boxArtPlaceholder]}>
      <Text style={styles.placeholderText}>🎮</Text>
    </View>
  );
}

/**
 * Box art image with caching and error fallback
 */
function BoxArt({ url }: { url: string }) {
  const [hasError, setHasError] = React.useState(false);

  if (!url || hasError) {
    return <BoxArtPlaceholder />;
  }

  return (
    <FastImage
      source={{
        uri: url,
        priority: FastImage.priority.normal,
        cache: FastImage.cacheControl.immutable,
      }}
      style={styles.boxArt}
      resizeMode={FastImage.resizeMode.cover}
      onError={() => setHasError(true)}
    />
  );
}

/**
 * Info button to open details modal
 */
function InfoButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.infoButton} onPress={onPress}>
      <Text style={styles.infoButtonText}>i</Text>
    </TouchableOpacity>
  );
}

/**
 * GameRow component with gestures
 */
function GameRowComponent({
  game,
  index,
  totalCount,
  onSwipe,
  onInfo,
  isDragging = false,
}: GameRowProps) {
  const haptics = useHaptics();
  const translateX = useSharedValue(0);
  const isSwipeTriggered = useSharedValue(false);

  // Position-based color: green gradient for "To Play", grey gradient for "Completed"
  const color = game.isCompleted
    ? getPositionalGrey(index, totalCount)
    : getPositionalGreen(index, totalCount);
  const gradientProps = getGradientProps(color);

  const handleSwipe = useCallback(() => {
    if (onSwipe) {
      haptics.light();
      onSwipe(game.id);
    }
  }, [onSwipe, game.id, haptics]);

  const handleInfo = useCallback(() => {
    if (onInfo) {
      haptics.light();
      onInfo(game.id);
    }
  }, [onInfo, game.id, haptics]);

  // Pan gesture for swipe
  const panGesture = Gesture.Pan()
    .activeOffsetX(10) // Only activate after 10px horizontal movement
    .failOffsetY([-30, 30]) // Fail if vertical movement exceeds 30px (more forgiving)
    .maxPointers(1) // Single finger only
    .onUpdate((event) => {
      // Only allow right swipe
      if (event.translationX > 0) {
        translateX.value = event.translationX;

        // Trigger haptic when crossing threshold
        if (event.translationX > SWIPE_THRESHOLD && !isSwipeTriggered.value) {
          isSwipeTriggered.value = true;
          runOnJS(haptics.selection)();
        } else if (event.translationX < SWIPE_THRESHOLD && isSwipeTriggered.value) {
          isSwipeTriggered.value = false;
        }
      }
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        // Snap back and trigger callback - LayoutAnimation handles the move
        translateX.value = withTiming(0, { duration: 150 });
        runOnJS(handleSwipe)();
      } else {
        // Spring back
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
      isSwipeTriggered.value = false;
    });


  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const swipeIndicatorStyle = useAnimatedStyle(() => ({
    opacity: Math.min(translateX.value / SWIPE_THRESHOLD, 1),
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={styles.rowWrapper}
        entering={FadeIn.duration(300)}
        exiting={FadeOut.duration(200)}
        layout={Layout.springify().damping(15).stiffness(100)}
      >
        {/* Swipe indicator behind the row */}
        <Animated.View style={[styles.swipeIndicator, swipeIndicatorStyle]}>
          <Text style={styles.swipeIndicatorText}>
            {game.isCompleted ? '↩' : '✓'}
          </Text>
        </Animated.View>
        <Animated.View style={[styles.rowContent, animatedStyle, isDragging && styles.dragging]}>
          {/* Gradient background layer */}
          <LinearGradient {...gradientProps} style={styles.gradientBackground} />
          {/* Content layer */}
          <View style={styles.content}>
            {/* Box Art */}
            <BoxArt url={game.boxArtUrl} />

            {/* Game Info */}
            <View style={styles.info}>
              <Text
                style={[
                  styles.gameName,
                  game.isCompleted && styles.completedText,
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {game.name}
              </Text>
              <Text
                style={[
                  styles.platformName,
                  game.isCompleted && styles.completedText,
                ]}
                numberOfLines={1}
              >
                {game.platform}
              </Text>
              {game.isCompleted && game.completedDate && (
                <Text style={styles.completedDate}>
                  Completed {formatCompletedDate(game.completedDate)}
                </Text>
              )}
            </View>

            {/* Info Button */}
            <InfoButton onPress={handleInfo} />
          </View>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  rowWrapper: {
    height: GAME_ROW_HEIGHT,
    overflow: 'hidden',
  },
  rowContent: {
    flex: 1,
  },
  swipeIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0,
  },
  swipeIndicatorText: {
    fontSize: 28,
    color: '#FFF',
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 16,
  },
  boxArt: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  boxArtPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 24,
  },
  info: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
    justifyContent: 'center',
  },
  gameName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  platformName: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  completedDate: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  completedText: {
    opacity: 0.7,
  },
  infoButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontStyle: 'italic',
    color: '#FFFFFF',
  },
  dragging: {
    opacity: 0.9,
    transform: [{ scale: 1.02 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});

export const GameRow = memo(GameRowComponent);
export default GameRow;
