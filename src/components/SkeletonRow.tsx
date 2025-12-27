/**
 * SkeletonRow - Placeholder loading state for game rows
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { GAME_ROW_HEIGHT } from './GameRow';

/**
 * Single skeleton row with shimmer animation
 */
function SkeletonRow({ index }: { index: number }) {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1200 }),
      -1,
      false
    );
  }, [shimmer]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.3, 0.6, 0.3]),
  }));

  // Stagger the animation slightly for each row
  const delayedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      shimmer.value,
      [0, 0.5, 1],
      [0.3 + index * 0.05, 0.6 + index * 0.05, 0.3 + index * 0.05]
    ),
  }));

  return (
    <View style={styles.row}>
      {/* Box art placeholder */}
      <Animated.View style={[styles.boxArt, animatedStyle]} />

      {/* Text placeholders */}
      <View style={styles.textContainer}>
        <Animated.View style={[styles.titlePlaceholder, delayedStyle]} />
        <Animated.View style={[styles.subtitlePlaceholder, delayedStyle]} />
      </View>

      {/* Info button placeholder */}
      <Animated.View style={[styles.infoButton, animatedStyle]} />
    </View>
  );
}

/**
 * Multiple skeleton rows for loading state
 */
export function SkeletonLoader({ count = 5 }: { count?: number }) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonRow key={index} index={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  row: {
    height: GAME_ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 16,
    backgroundColor: '#1a1a1a',
  },
  boxArt: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#333',
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
    justifyContent: 'center',
  },
  titlePlaceholder: {
    height: 16,
    width: '70%',
    borderRadius: 4,
    backgroundColor: '#333',
    marginBottom: 8,
  },
  subtitlePlaceholder: {
    height: 12,
    width: '40%',
    borderRadius: 4,
    backgroundColor: '#333',
  },
  infoButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#333',
  },
});

export default SkeletonLoader;
