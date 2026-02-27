/**
 * SearchBar - Persistent search bar at the bottom of the screen
 *
 * Uses measureInWindow to calculate exact keyboard offset, ensuring
 * zero gap between the search bar and keyboard on any device.
 */

import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
  Keyboard,
  Platform,
  Animated,
} from 'react-native';

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onFocus: () => void;
  onCancel: () => void;
  isActive: boolean;
}

export function SearchBar({
  value,
  onChangeText,
  onFocus,
  onCancel,
  isActive,
}: SearchBarProps) {
  const inputRef = useRef<TextInput>(null);
  const containerRef = useRef<View>(null);
  const bottomPosition = useRef(new Animated.Value(0)).current;
  const restingBottomY = useRef(0);

  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActive]);

  // Measure the resting screen position once on initial layout
  const measured = useRef(false);
  const handleLayout = useCallback(() => {
    if (measured.current) return;
    measured.current = true;
    requestAnimationFrame(() => {
      containerRef.current?.measureInWindow((_x, y, _width, height) => {
        restingBottomY.current = y + height;
      });
    });
  }, []);

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        const keyboardTopY = event.endCoordinates.screenY;
        const offset = restingBottomY.current - keyboardTopY;
        Animated.timing(bottomPosition, {
          toValue: Math.max(0, offset),
          duration: 100,
          useNativeDriver: false,
        }).start();
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        Animated.timing(bottomPosition, {
          toValue: 0,
          duration: 100,
          useNativeDriver: false,
        }).start();
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, [bottomPosition]);

  const handleCancel = useCallback(() => {
    Keyboard.dismiss();
    onCancel();
  }, [onCancel]);

  return (
    <Animated.View
      ref={containerRef}
      onLayout={handleLayout}
      style={[
        styles.container,
        {
          bottom: bottomPosition,
        },
      ]}
    >
      <View style={styles.inputContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="Search games to add..."
          placeholderTextColor="#666"
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={() => onChangeText('')} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
      {isActive && (
        <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>Done</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#111',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFF',
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
  clearButtonText: {
    fontSize: 14,
    color: '#666',
  },
  cancelButton: {
    marginLeft: 12,
    paddingVertical: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#4D96FF',
  },
});

export default SearchBar;
