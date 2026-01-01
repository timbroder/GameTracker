/**
 * SwipeCard - Tinder-style swipeable game card for discovery
 *
 * Supports:
 * - Swipe left to dismiss (mark as seen)
 * - Swipe right to add to collection
 * - Visual feedback for swipe direction
 */

import React, { memo, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useHaptics } from '../hooks';
import type { DiscoveryGame } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const ROTATION_ANGLE = 15;

export interface SwipeCardProps {
  game: DiscoveryGame;
  onSwipeLeft: (game: DiscoveryGame) => void;
  onSwipeRight: (game: DiscoveryGame) => void;
  isTopCard?: boolean;
}

function SwipeCardComponent({
  game,
  onSwipeLeft,
  onSwipeRight,
  isTopCard = true,
}: SwipeCardProps) {
  const haptics = useHaptics();
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const hasTriggeredHaptic = useSharedValue(false);

  const handleSwipeLeft = useCallback(() => {
    onSwipeLeft(game);
  }, [onSwipeLeft, game]);

  const handleSwipeRight = useCallback(() => {
    onSwipeRight(game);
  }, [onSwipeRight, game]);

  const panGesture = Gesture.Pan()
    .enabled(isTopCard)
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.5; // Dampen vertical movement

      // Haptic feedback when crossing threshold
      const absX = Math.abs(event.translationX);
      if (absX > SWIPE_THRESHOLD && !hasTriggeredHaptic.value) {
        hasTriggeredHaptic.value = true;
        runOnJS(haptics.selection)();
      } else if (absX < SWIPE_THRESHOLD && hasTriggeredHaptic.value) {
        hasTriggeredHaptic.value = false;
      }
    })
    .onEnd((event) => {
      const direction = event.translationX > 0 ? 1 : -1;

      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        // Swipe out
        translateX.value = withTiming(
          direction * SCREEN_WIDTH * 1.5,
          { duration: 200 },
          () => {
            runOnJS(direction > 0 ? handleSwipeRight : handleSwipeLeft)();
          }
        );
        translateY.value = withTiming(event.translationY, { duration: 200 });
      } else {
        // Spring back
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
        translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
      hasTriggeredHaptic.value = false;
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-ROTATION_ANGLE, 0, ROTATION_ANGLE],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  const leftIndicatorStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolation.CLAMP
    ),
  }));

  const rightIndicatorStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    ),
  }));

  // Format release year
  const releaseYear = game.released ? game.released.substring(0, 4) : null;
  const genreText = game.genres.slice(0, 2).join(' • ') || 'Unknown Genre';

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.card, cardStyle]}>
        {/* Background Image */}
        {game.backgroundImage ? (
          <FastImage
            source={{
              uri: game.backgroundImage,
              priority: FastImage.priority.high,
              cache: FastImage.cacheControl.immutable,
            }}
            style={styles.backgroundImage}
            resizeMode={FastImage.resizeMode.cover}
          />
        ) : (
          <View style={[styles.backgroundImage, styles.placeholderBg]}>
            <Text style={styles.placeholderEmoji}>🎮</Text>
          </View>
        )}

        {/* Gradient overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.gradient}
        />

        {/* Swipe indicators */}
        <Animated.View style={[styles.indicator, styles.indicatorLeft, leftIndicatorStyle]}>
          <Text style={styles.indicatorText}>SKIP</Text>
        </Animated.View>
        <Animated.View style={[styles.indicator, styles.indicatorRight, rightIndicatorStyle]}>
          <Text style={styles.indicatorText}>ADD</Text>
        </Animated.View>

        {/* Game info */}
        <View style={styles.info}>
          <Text style={styles.gameName} numberOfLines={2}>
            {game.name}
          </Text>
          {releaseYear && (
            <Text style={styles.releaseYear}>{releaseYear}</Text>
          )}
          <Text style={styles.genres} numberOfLines={1}>
            {genreText}
          </Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: SCREEN_WIDTH - 40,
    height: (SCREEN_WIDTH - 40) * 1.3,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
  },
  placeholderBg: {
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 80,
    opacity: 0.5,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  },
  indicator: {
    position: 'absolute',
    top: 40,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 3,
    borderRadius: 8,
  },
  indicatorLeft: {
    right: 20,
    borderColor: '#FF6B6B',
    transform: [{ rotate: '15deg' }],
  },
  indicatorRight: {
    left: 20,
    borderColor: '#4ECB71',
    transform: [{ rotate: '-15deg' }],
  },
  indicatorText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 2,
  },
  info: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  gameName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  releaseYear: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  genres: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
});

export const SwipeCard = memo(SwipeCardComponent);
export default SwipeCard;
