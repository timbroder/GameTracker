/**
 * PlatformSelector - Grid of legacy platform buttons for discovery
 */

import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LEGACY_PLATFORMS, type LegacyPlatform } from '../types';

export interface PlatformSelectorProps {
  onSelectPlatform: (platform: LegacyPlatform) => void;
}

export function PlatformSelector({ onSelectPlatform }: PlatformSelectorProps) {
  const handlePress = useCallback(
    (platform: LegacyPlatform) => {
      onSelectPlatform(platform);
    },
    [onSelectPlatform]
  );

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Choose a Platform</Text>
      <Text style={styles.subtitle}>Discover games to play</Text>
      <View style={styles.grid}>
        {LEGACY_PLATFORMS.map((platform) => (
          <TouchableOpacity
            key={platform.id}
            style={[styles.platformButton, { backgroundColor: platform.color }]}
            onPress={() => handlePress(platform)}
            activeOpacity={0.7}
          >
            <Text style={styles.platformName}>{platform.shortName}</Text>
            <Text style={styles.platformFullName}>{platform.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 40,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    maxWidth: 320,
  },
  platformButton: {
    width: 140,
    height: 100,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  platformName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  platformFullName: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
});

export default PlatformSelector;
