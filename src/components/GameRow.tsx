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
  getPositionalGold,
  getPositionalBlue,
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

export type SwipeAction = 'completed' | 'moveUp1' | 'moveUp2';

export interface GameRowProps {
  game: Game;
  index: number;      // Position in the list (0-based)
  totalCount: number; // Total items in this section
  section?: 'shortList' | 'toPlay' | 'somedayMaybe' | 'completed';
  onSwipe?: (gameId: string, action: SwipeAction) => void;
  onInfo?: (gameId: string) => void;
  isDragging?: boolean;
}

/**
 * Row height - sized to fit box art with padding
 */
export const GAME_ROW_HEIGHT = 88;

/**
 * Multi-zone swipe thresholds
 */
const SWIPE_ZONE_1 = 60;
const SWIPE_ZONE_2 = 120;
const SWIPE_ZONE_3 = 180;

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
/**
 * Get the maximum zone available for a given section
 * Short List: zone 1 only (completed)
 * To Play: zones 1-2 (completed, Short List)
 * Someday Maybe: zones 1-3 (completed, To Play, Short List)
 * Completed: zones 1-3 (un-complete to Someday Maybe, To Play, Short List)
 */
function getMaxZone(section?: string): number {
  switch (section) {
    case 'shortList': return 1;
    case 'toPlay': return 2;
    case 'somedayMaybe': return 3;
    case 'completed': return 3;
    default: return 1;
  }
}

/**
 * Get the icon for a given zone and section
 */
function getZoneIcon(zone: number, section?: string): string {
  if (section === 'completed') {
    if (zone === 1) return '↩';
    if (zone === 2) return '↑';
    return '⇈';
  }
  if (zone === 1) return '✓';
  if (zone === 2) return '↑';
  return '⇈';
}

/**
 * Get the zone color
 * Zone 1 = green (complete/un-complete), Zones 2-3 = blue (promote)
 */
function getZoneColor(zone: number): string {
  return zone === 1 ? '#4CAF50' : '#1A237E';
}

/**
 * Determine swipe action from zone and section
 */
function getSwipeAction(zone: number, section?: string): SwipeAction {
  if (zone === 1) return 'completed';
  if (zone === 2) return 'moveUp1';
  return 'moveUp2';
}

function GameRowComponent({
  game,
  index,
  totalCount,
  section,
  onSwipe,
  onInfo,
  isDragging = false,
}: GameRowProps) {
  const haptics = useHaptics();
  const translateX = useSharedValue(0);
  const currentZone = useSharedValue(0);

  const maxZone = getMaxZone(section);

  // Position-based color based on section
  const getColorForSection = () => {
    if (section === 'shortList') return getPositionalGold(index, totalCount);
    if (section === 'completed') return getPositionalGrey(index, totalCount);
    if (section === 'somedayMaybe') return getPositionalBlue(index, totalCount);
    if (section === 'toPlay') return getPositionalGreen(index, totalCount);
    // Fallback for backward compat (no section prop)
    return game.isCompleted
      ? getPositionalGrey(index, totalCount)
      : getPositionalGreen(index, totalCount);
  };
  const color = getColorForSection();
  const gradientProps = getGradientProps(color);

  const handleSwipeAction = useCallback((zone: number) => {
    if (onSwipe && zone > 0) {
      haptics.light();
      const action = getSwipeAction(zone, section);
      onSwipe(game.id, action);
    }
  }, [onSwipe, game.id, haptics, section]);

  const handleInfo = useCallback(() => {
    if (onInfo) {
      haptics.light();
      onInfo(game.id);
    }
  }, [onInfo, game.id, haptics]);

  // Compute zone from translation
  const computeZone = useCallback((translationX: number): number => {
    if (translationX >= SWIPE_ZONE_3 && maxZone >= 3) return 3;
    if (translationX >= SWIPE_ZONE_2 && maxZone >= 2) return 2;
    if (translationX >= SWIPE_ZONE_1) return 1;
    return 0;
  }, [maxZone]);

  // Pan gesture for swipe
  const panGesture = Gesture.Pan()
    .activeOffsetX(10)
    .failOffsetY([-30, 30])
    .maxPointers(1)
    .onUpdate((event) => {
      if (event.translationX > 0) {
        translateX.value = event.translationX;

        const newZone = event.translationX >= SWIPE_ZONE_3 && maxZone >= 3 ? 3
          : event.translationX >= SWIPE_ZONE_2 && maxZone >= 2 ? 2
          : event.translationX >= SWIPE_ZONE_1 ? 1
          : 0;

        if (newZone !== currentZone.value) {
          currentZone.value = newZone;
          runOnJS(haptics.selection)();
        }
      }
    })
    .onEnd((event) => {
      const finalZone = currentZone.value;
      if (finalZone > 0) {
        translateX.value = withTiming(0, { duration: 150 });
        runOnJS(handleSwipeAction)(finalZone);
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
      currentZone.value = 0;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Zone 1 indicator (green)
  const zone1Style = useAnimatedStyle(() => ({
    opacity: translateX.value >= SWIPE_ZONE_1 ? 1 : Math.min(translateX.value / SWIPE_ZONE_1, 1),
  }));

  // Zone 2 indicator (blue, replaces zone 1)
  const zone2Style = useAnimatedStyle(() => {
    if (maxZone < 2) return { opacity: 0 };
    return {
      opacity: translateX.value >= SWIPE_ZONE_2
        ? 1
        : translateX.value >= SWIPE_ZONE_1
          ? (translateX.value - SWIPE_ZONE_1) / (SWIPE_ZONE_2 - SWIPE_ZONE_1)
          : 0,
    };
  });

  // Zone 3 indicator (blue, replaces zone 2)
  const zone3Style = useAnimatedStyle(() => {
    if (maxZone < 3) return { opacity: 0 };
    return {
      opacity: translateX.value >= SWIPE_ZONE_3
        ? 1
        : translateX.value >= SWIPE_ZONE_2
          ? (translateX.value - SWIPE_ZONE_2) / (SWIPE_ZONE_3 - SWIPE_ZONE_2)
          : 0,
    };
  });

  const zone1Icon = getZoneIcon(1, section);
  const zone2Icon = getZoneIcon(2, section);
  const zone3Icon = getZoneIcon(3, section);

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={styles.rowWrapper}
        entering={FadeIn.duration(300)}
        exiting={FadeOut.duration(200)}
        layout={Layout.springify().damping(15).stiffness(100)}
      >
        {/* Swipe indicators behind the row (stacked, higher zones on top) */}
        <Animated.View style={[styles.swipeIndicator, { backgroundColor: getZoneColor(1) }, zone1Style]}>
          <Text style={styles.swipeIndicatorText}>{zone1Icon}</Text>
        </Animated.View>
        {maxZone >= 2 && (
          <Animated.View style={[styles.swipeIndicator, { backgroundColor: getZoneColor(2) }, zone2Style]}>
            <Text style={styles.swipeIndicatorText}>{zone2Icon}</Text>
          </Animated.View>
        )}
        {maxZone >= 3 && (
          <Animated.View style={[styles.swipeIndicator, { backgroundColor: getZoneColor(3) }, zone3Style]}>
            <Text style={styles.swipeIndicatorText}>{zone3Icon}</Text>
          </Animated.View>
        )}
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
