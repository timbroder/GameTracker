/**
 * GameRow - Clear-style game row component with gestures
 *
 * Displays a single game with gradient background, box art, and platform info.
 * Supports:
 * - Swipe right to toggle completed status
 * - Long press to edit
 * - Completed state with grey coloring
 */

import React, { memo, useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import FastImage from 'react-native-fast-image';
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

export type SwipeAction = 'completed' | 'moveUp1' | 'moveUp2' | 'moveDown1' | 'moveDown2';

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
 * Get the maximum RIGHT swipe zone for a given section (promote / complete)
 * Short List: zone 1 only (completed)
 * To Play: zones 1-2 (completed, Short List)
 * Someday Maybe: zones 1-3 (completed, To Play, Short List)
 * Completed: zones 1-3 (un-complete to Someday Maybe, To Play, Short List)
 */
function getMaxRightZone(section?: string): number {
  switch (section) {
    case 'shortList': return 1;
    case 'toPlay': return 2;
    case 'somedayMaybe': return 3;
    case 'completed': return 3;
    default: return 1;
  }
}

/**
 * Get the maximum LEFT swipe zone for a given section (demote)
 * Short List: zones 1-2 (↓ To Play, ⇊ Someday Maybe)
 * To Play: zone 1 (↓ Someday Maybe)
 * Someday Maybe: 0 (already lowest non-completed)
 * Completed: 0 (already at bottom)
 */
function getMaxLeftZone(section?: string): number {
  switch (section) {
    case 'shortList': return 2;
    case 'toPlay': return 1;
    case 'somedayMaybe': return 0;
    case 'completed': return 0;
    default: return 0;
  }
}

/**
 * Get the icon for a right-swipe zone and section
 */
function getRightZoneIcon(zone: number, section?: string): string {
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
 * Get the icon for a left-swipe zone
 */
function getLeftZoneIcon(zone: number): string {
  if (zone === 1) return '↓';
  return '⇊';
}

const ACTIVE_ZONE_COLOR = '#4CAF50';   // Green for active zone
const INACTIVE_ZONE_COLOR = '#1C1C1E'; // Dark/black for inactive zones

/**
 * Determine right-swipe action from zone
 */
function getRightSwipeAction(zone: number): SwipeAction {
  if (zone === 1) return 'completed';
  if (zone === 2) return 'moveUp1';
  return 'moveUp2';
}

/**
 * Determine left-swipe action from zone
 */
function getLeftSwipeAction(zone: number): SwipeAction {
  if (zone === 1) return 'moveDown1';
  return 'moveDown2';
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
  const currentZone = useSharedValue(0); // positive = right zones, negative = left zones
  const [isSwiping, setIsSwiping] = useState(false);

  const maxRightZone = getMaxRightZone(section);
  const maxLeftZone = getMaxLeftZone(section);

  // Position-based color based on section (memoized to avoid recomputing on every render)
  const gradientProps = useMemo(() => {
    let color;
    if (section === 'shortList') color = getPositionalGold(index, totalCount);
    else if (section === 'completed') color = getPositionalGrey(index, totalCount);
    else if (section === 'somedayMaybe') color = getPositionalBlue(index, totalCount);
    else if (section === 'toPlay') color = getPositionalGreen(index, totalCount);
    else color = game.isCompleted
      ? getPositionalGrey(index, totalCount)
      : getPositionalGreen(index, totalCount);
    return getGradientProps(color);
  }, [section, index, totalCount, game.isCompleted]);

  const handleSwipeAction = useCallback((zone: number) => {
    if (!onSwipe || zone === 0) return;
    haptics.light();
    const action = zone > 0
      ? getRightSwipeAction(zone)
      : getLeftSwipeAction(Math.abs(zone));
    onSwipe(game.id, action);
  }, [onSwipe, game.id, haptics]);

  const handleInfo = useCallback(() => {
    if (onInfo) {
      haptics.light();
      onInfo(game.id);
    }
  }, [onInfo, game.id, haptics]);

  const showSwipeIndicators = useCallback(() => setIsSwiping(true), []);
  const hideSwipeIndicators = useCallback(() => setIsSwiping(false), []);

  // Pan gesture for bidirectional swipe (memoized to avoid recreating on every render)
  const panGesture = useMemo(() => Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-30, 30])
    .maxPointers(1)
    .onStart(() => {
      runOnJS(showSwipeIndicators)();
    })
    .onUpdate((event) => {
      const tx = event.translationX;

      if (tx > 0) {
        // Right swipe (promote / complete)
        translateX.value = tx;

        const newZone = tx >= SWIPE_ZONE_3 && maxRightZone >= 3 ? 3
          : tx >= SWIPE_ZONE_2 && maxRightZone >= 2 ? 2
          : tx >= SWIPE_ZONE_1 ? 1
          : 0;

        if (newZone !== currentZone.value) {
          currentZone.value = newZone;
          runOnJS(haptics.selection)();
        }
      } else if (tx < 0 && maxLeftZone > 0) {
        // Left swipe (demote)
        translateX.value = tx;
        const absTx = Math.abs(tx);

        const newZone = absTx >= SWIPE_ZONE_2 && maxLeftZone >= 2 ? -2
          : absTx >= SWIPE_ZONE_1 ? -1
          : 0;

        if (newZone !== currentZone.value) {
          currentZone.value = newZone;
          runOnJS(haptics.selection)();
        }
      }
    })
    .onEnd(() => {
      const finalZone = currentZone.value;
      if (finalZone !== 0) {
        translateX.value = withTiming(0, { duration: 150 });
        runOnJS(handleSwipeAction)(finalZone);
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
      currentZone.value = 0;
      runOnJS(hideSwipeIndicators)();
    }), [maxRightZone, maxLeftZone, handleSwipeAction, haptics, showSwipeIndicators, hideSwipeIndicators]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // === Swipe zone backgrounds (only created when hooks are called, but always called) ===
  const rightZone1Bg = useAnimatedStyle(() => ({
    backgroundColor: currentZone.value === 1 ? ACTIVE_ZONE_COLOR : INACTIVE_ZONE_COLOR,
  }));

  const rightZone2Bg = useAnimatedStyle(() => ({
    backgroundColor: currentZone.value === 2 ? ACTIVE_ZONE_COLOR : INACTIVE_ZONE_COLOR,
  }));

  const rightZone3Bg = useAnimatedStyle(() => ({
    backgroundColor: currentZone.value === 3 ? ACTIVE_ZONE_COLOR : INACTIVE_ZONE_COLOR,
  }));

  const leftZone1Bg = useAnimatedStyle(() => ({
    backgroundColor: currentZone.value === -1 ? ACTIVE_ZONE_COLOR : INACTIVE_ZONE_COLOR,
  }));

  const leftZone2Bg = useAnimatedStyle(() => ({
    backgroundColor: currentZone.value === -2 ? ACTIVE_ZONE_COLOR : INACTIVE_ZONE_COLOR,
  }));

  const rIcon1 = getRightZoneIcon(1, section);
  const rIcon2 = getRightZoneIcon(2, section);
  const rIcon3 = getRightZoneIcon(3, section);
  const lIcon1 = getLeftZoneIcon(1);
  const lIcon2 = getLeftZoneIcon(2);

  return (
    <GestureDetector gesture={panGesture}>
      <View style={styles.rowWrapper}>
        {/* Swipe indicators only mount when actively swiping */}
        {isSwiping && (
          <>
            {/* Right-swipe indicators (left side, side-by-side) */}
            <View style={styles.rightSwipeContainer}>
              <Animated.View style={[styles.swipeIcon, rightZone1Bg]}>
                <Text style={styles.swipeIconText}>{rIcon1}</Text>
              </Animated.View>
              {maxRightZone >= 2 && (
                <Animated.View style={[styles.swipeIcon, rightZone2Bg]}>
                  <Text style={styles.swipeIconText}>{rIcon2}</Text>
                </Animated.View>
              )}
              {maxRightZone >= 3 && (
                <Animated.View style={[styles.swipeIcon, rightZone3Bg]}>
                  <Text style={styles.swipeIconText}>{rIcon3}</Text>
                </Animated.View>
              )}
            </View>

            {/* Left-swipe indicators (right side, side-by-side) */}
            {maxLeftZone >= 1 && (
              <View style={styles.leftSwipeContainer}>
                {maxLeftZone >= 2 && (
                  <Animated.View style={[styles.swipeIcon, leftZone2Bg]}>
                    <Text style={styles.swipeIconText}>{lIcon2}</Text>
                  </Animated.View>
                )}
                <Animated.View style={[styles.swipeIcon, leftZone1Bg]}>
                  <Text style={styles.swipeIconText}>{lIcon1}</Text>
                </Animated.View>
              </View>
            )}
          </>
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
      </View>
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
  rightSwipeContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  leftSwipeContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  swipeIcon: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeIconText: {
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
