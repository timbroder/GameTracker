/**
 * SearchResults - Full-screen overlay showing search results
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { GameSearchResult, Platform } from '../types';

export interface SearchResultsProps {
  visible: boolean;
  results: GameSearchResult[];
  loading: boolean;
  error: string | null;
  onSelectGame: (game: GameSearchResult, platform: Platform) => void;
  onClose: () => void;
}

/**
 * Platform selector modal
 */
function PlatformSelector({
  visible,
  platforms,
  onSelect,
  onClose,
}: {
  visible: boolean;
  platforms: Platform[];
  onSelect: (platform: Platform) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.platformModalOverlay}>
        <View style={styles.platformModalContent}>
          <Text style={styles.platformModalTitle}>Select Platform</Text>
          <FlatList
            data={platforms}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.platformOption}
                onPress={() => onSelect(item)}
              >
                <Text style={styles.platformOptionText}>{item.name}</Text>
              </TouchableOpacity>
            )}
            style={styles.platformList}
          />
          <TouchableOpacity style={styles.platformCancelButton} onPress={onClose}>
            <Text style={styles.platformCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Single search result row
 */
function SearchResultRow({
  game,
  onPress,
}: {
  game: GameSearchResult;
  onPress: () => void;
}) {
  const platformNames = game.platforms
    ?.slice(0, 3)
    .map((p) => p.platform.name)
    .join(', ');
  const hasMore = game.platforms?.length > 3;

  return (
    <TouchableOpacity style={styles.resultRow} onPress={onPress}>
      {game.background_image ? (
        <FastImage
          source={{
            uri: game.background_image,
            priority: FastImage.priority.normal,
          }}
          style={styles.resultImage}
          resizeMode={FastImage.resizeMode.cover}
        />
      ) : (
        <View style={[styles.resultImage, styles.placeholderImage]}>
          <Text style={styles.placeholderText}>🎮</Text>
        </View>
      )}
      <View style={styles.resultInfo}>
        <Text style={styles.resultName} numberOfLines={1}>
          {game.name}
        </Text>
        <Text style={styles.resultPlatforms} numberOfLines={1}>
          {platformNames}
          {hasMore ? '...' : ''}
        </Text>
      </View>
      <Text style={styles.addIcon}>+</Text>
    </TouchableOpacity>
  );
}

export function SearchResults({
  visible,
  results,
  loading,
  error,
  onSelectGame,
  onClose,
}: SearchResultsProps) {
  const insets = useSafeAreaInsets();
  const [selectedGame, setSelectedGame] = useState<GameSearchResult | null>(null);

  if (!visible) {
    return null;
  }

  const handleGamePress = (game: GameSearchResult) => {
    if (game.platforms?.length === 1) {
      // Only one platform, select it directly
      onSelectGame(game, game.platforms[0].platform);
    } else if (game.platforms?.length > 1) {
      // Multiple platforms, show selector
      setSelectedGame(game);
    }
  };

  const handlePlatformSelect = (platform: Platform) => {
    if (selectedGame) {
      onSelectGame(selectedGame, platform);
      setSelectedGame(null);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Loading state */}
      {loading && (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#4D96FF" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      )}

      {/* Error state */}
      {error && !loading && (
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Empty state */}
      {!loading && !error && results.length === 0 && (
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>Type to search for games</Text>
        </View>
      )}

      {/* Results list */}
      {!loading && !error && results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <SearchResultRow game={item} onPress={() => handleGamePress(item)} />
          )}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          getItemLayout={(_data, index) => ({
            length: 85,
            offset: 85 * index,
            index,
          })}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          removeClippedSubviews={true}
        />
      )}

      {/* Platform selector modal */}
      <PlatformSelector
        visible={selectedGame !== null}
        platforms={selectedGame?.platforms?.map((p) => p.platform) || []}
        onSelect={handlePlatformSelect}
        onClose={() => setSelectedGame(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: '#888',
    fontSize: 14,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    textAlign: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 120, // Space for search bar
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  resultImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#222',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 24,
  },
  resultInfo: {
    flex: 1,
    marginLeft: 12,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  resultPlatforms: {
    fontSize: 13,
    color: '#888',
  },
  addIcon: {
    fontSize: 24,
    color: '#4D96FF',
    paddingHorizontal: 12,
  },
  // Platform selector modal
  platformModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  platformModalContent: {
    backgroundColor: '#222',
    borderRadius: 16,
    width: '100%',
    maxWidth: 300,
    maxHeight: '60%',
    overflow: 'hidden',
  },
  platformModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  platformList: {
    maxHeight: 300,
  },
  platformOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  platformOptionText: {
    fontSize: 16,
    color: '#FFF',
    textAlign: 'center',
  },
  platformCancelButton: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  platformCancelText: {
    fontSize: 16,
    color: '#FF6B6B',
    textAlign: 'center',
  },
});

export default SearchResults;
