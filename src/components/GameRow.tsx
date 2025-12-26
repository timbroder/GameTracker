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
import { View, Text, Image, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import type { Game } from '../types';
import {
  getGameColor,
  getGradientProps,
  COMPLETED_OPACITY,
} from '../utils/colors';
import { useHaptics } from '../hooks/useHaptics';

export interface GameRowProps {
  game: Game;
  onSwipe?: (gameId: string) => void;
  onLongPress?: (gameId: string) => void;
  onPinch?: (gameId: string) => void;
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
 * Box art image with loading state and error fallback
 */
function BoxArt({ url }: { url: string }) {
  const [hasError, setHasError] = React.useState(false);

  if (!url || hasError) {
    return <BoxArtPlaceholder />;
  }

  return (
    <Image
      source={{ uri: url }}
      style={styles.boxArt}
      resizeMode="cover"
      onError={() => setHasError(true)}
    />
  );
}

/**
 * Platform badge showing platform name
 */
function PlatformBadge({
  name,
  logoUrl,
}: {
  name: string;
  logoUrl?: string;
}) {
  const [hasError, setHasError] = React.useState(false);

  if (logoUrl && !hasError) {
    return (
      <Image
        source={{ uri: logoUrl }}
        style={styles.platformLogo}
        resizeMode="contain"
        onError={() => setHasError(true)}
      />
    );
  }

  const abbreviation = getPlatformAbbreviation(name);
  return (
    <View style={styles.platformBadge}>
      <Text style={styles.platformBadgeText}>{abbreviation}</Text>
    </View>
  );
}

/**
 * Get abbreviated platform name for badge
 */
function getPlatformAbbreviation(name: string): string {
  const abbreviations: Record<string, string> = {
    'PlayStation 5': 'PS5',
    'PlayStation 4': 'PS4',
    'PlayStation 3': 'PS3',
    'PlayStation 2': 'PS2',
    PlayStation: 'PS1',
    'Xbox Series S/X': 'XSX',
    'Xbox One': 'XB1',
    'Xbox 360': 'X360',
    Xbox: 'Xbox',
    'Nintendo Switch': 'NSW',
    'Nintendo 3DS': '3DS',
    'Nintendo DS': 'NDS',
    Wii: 'Wii',
    'Wii U': 'WiiU',
    PC: 'PC',
    macOS: 'Mac',
    Linux: 'Linux',
    iOS: 'iOS',
    Android: 'And',
  };

  return abbreviations[name] || name.substring(0, 4);
}

/**
 * GameRow component with gestures
 */
function GameRowComponent({
  game,
  onSwipe,
  onLongPress,
  isDragging = false,
}: GameRowProps) {
  const haptics = useHaptics();
  const translateX = useSharedValue(0);
  const isSwipeTriggered = useSharedValue(false);

  const color = getGameColor(game.colorIndex, game.isCompleted);
  const opacity = game.isCompleted ? COMPLETED_OPACITY : 1;
  const gradientProps = getGradientProps(color, opacity);

  const handleSwipe = useCallback(() => {
    if (onSwipe) {
      haptics.light();
      onSwipe(game.id);
    }
  }, [onSwipe, game.id, haptics]);

  const handleLongPress = useCallback(() => {
    if (onLongPress) {
      haptics.medium();
      onLongPress(game.id);
    }
  }, [onLongPress, game.id, haptics]);

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

  // Long press gesture
  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .onStart(() => {
      runOnJS(handleLongPress)();
    });

  // Combine gestures - pan takes priority
  const composedGesture = Gesture.Race(panGesture, longPressGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const swipeIndicatorStyle = useAnimatedStyle(() => ({
    opacity: Math.min(translateX.value / SWIPE_THRESHOLD, 1),
  }));

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={styles.rowWrapper}>
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
            </View>

            {/* Platform Badge */}
            <PlatformBadge
              name={game.platform}
              logoUrl={game.platformLogoUrl}
            />
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
  completedText: {
    opacity: 0.7,
  },
  platformLogo: {
    width: 24,
    height: 24,
  },
  platformBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  platformBadgeText: {
    fontSize: 11,
    fontWeight: '600',
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
