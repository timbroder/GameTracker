/**
 * UndoButton - Floating button to undo last swipe action
 */

import React, { memo } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';

export interface UndoButtonProps {
  onPress: () => void;
  visible: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

function UndoButtonComponent({ onPress, visible }: UndoButtonProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: withSpring(visible ? 1 : 0.8, { damping: 15 }) },
    ],
  }));

  if (!visible) {
    return null;
  }

  return (
    <AnimatedTouchable
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      style={[styles.button, animatedStyle]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.icon}>↩️</Text>
      <Text style={styles.text}>Undo</Text>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  icon: {
    fontSize: 18,
    marginRight: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export const UndoButton = memo(UndoButtonComponent);
export default UndoButton;
