/**
 * DiscoveryScreen - Legacy game discovery with Tinder-style swiping
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { PlatformSelector, SwipeDeck, UndoButton } from '../components';
import { useDiscovery } from '../hooks';

export function DiscoveryScreen() {
  const {
    state,
    selectedPlatform,
    games,
    loading,
    canUndo,
    selectPlatform,
    goBack,
    handleSwipeLeft,
    handleSwipeRight,
    handleAddToPlay,
    undo,
    loadMore,
  } = useDiscovery();

  // Platform selection view
  if (state === 'platform_selection') {
    return (
      <View style={styles.container}>
        <PlatformSelector onSelectPlatform={selectPlatform} />
      </View>
    );
  }

  // Loading view (initial load)
  if (state === 'loading') {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#4D96FF" />
          <Text style={styles.loadingText}>
            Loading {selectedPlatform?.name} games...
          </Text>
        </View>
      </View>
    );
  }

  // Empty state (all games seen)
  if (state === 'empty') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{selectedPlatform?.name}</Text>
          <View style={styles.headerButton} />
        </View>
        <View style={styles.centerContent}>
          <Text style={styles.emptyEmoji}>🎉</Text>
          <Text style={styles.emptyTitle}>All Caught Up!</Text>
          <Text style={styles.emptySubtitle}>
            You've seen all {selectedPlatform?.name} games
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Text style={styles.backButtonText}>Choose Another Platform</Text>
          </TouchableOpacity>
        </View>
        <UndoButton onPress={undo} visible={canUndo} />
      </View>
    );
  }

  // Error state
  if (state === 'error') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{selectedPlatform?.name}</Text>
          <View style={styles.headerButton} />
        </View>
        <View style={styles.centerContent}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorSubtitle}>Failed to load games</Text>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Text style={styles.backButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Swiping view
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{selectedPlatform?.name}</Text>
        <View style={styles.headerButton} />
      </View>

      <View style={styles.deckContainer}>
        <SwipeDeck
          games={games}
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
          onNeedMore={loadMore}
          loading={loading}
        />
      </View>

      {/* Action buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.skipButton]}
          onPress={() => games[0] && handleSwipeLeft(games[0])}
          disabled={games.length === 0}
        >
          <Text style={styles.actionButtonIcon}>✕</Text>
          <Text style={styles.actionButtonText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.toPlayButton]}
          onPress={() => games[0] && handleAddToPlay(games[0])}
          disabled={games.length === 0}
        >
          <Text style={styles.actionButtonIcon}>+</Text>
          <Text style={styles.actionButtonText}>Add</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.playedButton]}
          onPress={() => games[0] && handleSwipeRight(games[0])}
          disabled={games.length === 0}
        >
          <Text style={styles.actionButtonIcon}>✓</Text>
          <Text style={styles.actionButtonText}>Played</Text>
        </TouchableOpacity>
      </View>

      <UndoButton onPress={undo} visible={canUndo} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    fontSize: 16,
    color: '#888',
    marginTop: 16,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 32,
    textAlign: 'center',
  },
  errorEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 32,
  },
  backButton: {
    backgroundColor: '#4D96FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  headerButton: {
    width: 70,
  },
  headerButtonText: {
    fontSize: 16,
    color: '#4D96FF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  deckContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingBottom: 100,
  },
  actionButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  skipButton: {
    borderColor: '#FF6B6B',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  toPlayButton: {
    borderColor: '#4D96FF',
    backgroundColor: 'rgba(77, 150, 255, 0.1)',
  },
  playedButton: {
    borderColor: '#4ECB71',
    backgroundColor: 'rgba(78, 203, 113, 0.1)',
  },
  actionButtonIcon: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  actionButtonText: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
});

export default DiscoveryScreen;
