/**
 * SearchBar - Persistent search bar at the bottom of the screen
 *
 * Uses InputAccessoryView on iOS to dock flush against the keyboard
 * with zero gap. Falls back to manual positioning on Android.
 */

import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
  Keyboard,
  InputAccessoryView,
  Platform,
} from 'react-native';

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onFocus: () => void;
  onCancel: () => void;
  isActive: boolean;
}

const INPUT_ACCESSORY_ID = 'searchBarAccessory';

export function SearchBar({
  value,
  onChangeText,
  onFocus,
  onCancel,
  isActive,
}: SearchBarProps) {
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActive]);

  const handleCancel = useCallback(() => {
    Keyboard.dismiss();
    onCancel();
  }, [onCancel]);

  const searchBarContent = (
    <View style={styles.container}>
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
          inputAccessoryViewID={Platform.OS === 'ios' ? INPUT_ACCESSORY_ID : undefined}
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
    </View>
  );

  return (
    <>
      {/* Static search bar at bottom of screen (visible when keyboard is hidden) */}
      <View style={styles.staticContainer}>
        {searchBarContent}
      </View>

      {/* InputAccessoryView docks flush to keyboard on iOS */}
      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={INPUT_ACCESSORY_ID}>
          {searchBarContent}
        </InputAccessoryView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  staticContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
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
