/**
 * RawgIdMatcher - Full-screen modal for matching games to RAWG entries
 *
 * Shows one unmatched game at a time, auto-searches RAWG by name,
 * and lets the user tap a result to link it or skip.
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRawgIdMatcher } from '../hooks/useRawgIdMatcher';
import type { GameSearchResult } from '../types';

export interface RawgIdMatcherProps {
  visible: boolean;
  onClose: () => void;
}

function ResultRow({
  result,
  onPress,
}: {
  result: GameSearchResult;
  onPress: () => void;
}) {
  const platformNames = result.platforms
    ?.slice(0, 3)
    .map(p => p.platform.name)
    .join(', ');
  const hasMore = result.platforms?.length > 3;

  return (
    <TouchableOpacity style={styles.resultRow} onPress={onPress}>
      {result.background_image ? (
        <FastImage
          source={{
            uri: result.background_image,
            priority: FastImage.priority.normal,
          }}
          style={styles.resultImage}
          resizeMode={FastImage.resizeMode.cover}
        />
      ) : (
        <View style={[styles.resultImage, styles.placeholderImage]}>
          <Text style={styles.placeholderText}>?</Text>
        </View>
      )}
      <View style={styles.resultInfo}>
        <Text style={styles.resultName} numberOfLines={1}>
          {result.name}
        </Text>
        <Text style={styles.resultPlatforms} numberOfLines={1}>
          {platformNames}
          {hasMore ? '...' : ''}
        </Text>
      </View>
      <Text style={styles.linkIcon}>Link</Text>
    </TouchableOpacity>
  );
}

export function RawgIdMatcher({ visible, onClose }: RawgIdMatcherProps) {
  const insets = useSafeAreaInsets();
  const {
    currentGame,
    currentIndex,
    totalCount,
    matchedCount,
    skippedCount,
    searchQuery,
    searchResults,
    isLoading,
    isSearching,
    isDone,
    setSearchQuery,
    matchGame,
    skipGame,
    loadGames,
  } = useRawgIdMatcher();

  useEffect(() => {
    if (visible) {
      loadGames();
    }
  }, [visible, loadGames]);

  const progressPercent = totalCount > 0
    ? ((currentIndex) / totalCount) * 100
    : 0;

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#4D96FF" />
          <Text style={styles.loadingText}>Loading games...</Text>
        </View>
      );
    }

    if (totalCount === 0) {
      return (
        <View style={styles.centerContent}>
          <Text style={styles.doneEmoji}>✅</Text>
          <Text style={styles.doneTitle}>All Matched!</Text>
          <Text style={styles.doneSubtitle}>
            Every game already has a RAWG ID.
          </Text>
        </View>
      );
    }

    if (isDone) {
      return (
        <View style={styles.centerContent}>
          <Text style={styles.doneEmoji}>🎉</Text>
          <Text style={styles.doneTitle}>All Done!</Text>
          <Text style={styles.doneSubtitle}>
            Matched: {matchedCount}  ·  Skipped: {skippedCount}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.matcherContent}>
        {/* Progress */}
        <View style={styles.progressSection}>
          <Text style={styles.progressText}>
            Game {currentIndex + 1} of {totalCount}
          </Text>
          <Text style={styles.countsText}>
            {matchedCount} matched · {skippedCount} skipped
          </Text>
          <View style={styles.progressBarBg}>
            <View
              style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
            />
          </View>
        </View>

        {/* Current Game */}
        <View style={styles.currentGame}>
          <Text style={styles.currentGameName}>{currentGame?.name}</Text>
          <Text style={styles.currentGamePlatform}>{currentGame?.platform}</Text>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search RAWG..."
            placeholderTextColor="#666"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
        </View>

        {/* Results */}
        {isSearching ? (
          <View style={styles.searchingContainer}>
            <ActivityIndicator size="small" color="#4D96FF" />
            <Text style={styles.searchingText}>Searching...</Text>
          </View>
        ) : searchResults.length === 0 && searchQuery.trim() ? (
          <View style={styles.searchingContainer}>
            <Text style={styles.noResultsText}>
              No results. Try editing the search.
            </Text>
          </View>
        ) : (
          <FlatList
            data={searchResults}
            keyExtractor={item => String(item.id)}
            renderItem={({ item }) => (
              <ResultRow
                result={item}
                onPress={() => matchGame(item)}
              />
            )}
            keyboardShouldPersistTaps="handled"
            style={styles.resultsList}
          />
        )}

        {/* Skip Button */}
        <TouchableOpacity style={styles.skipButton} onPress={skipGame}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.container,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Match RAWG IDs</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.doneButton}>Done</Text>
          </TouchableOpacity>
        </View>

        {renderContent()}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  doneButton: {
    fontSize: 17,
    fontWeight: '600',
    color: '#4D96FF',
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
  doneEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  doneTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8,
  },
  doneSubtitle: {
    fontSize: 16,
    color: '#888',
  },
  matcherContent: {
    flex: 1,
  },
  progressSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 2,
  },
  countsText: {
    fontSize: 13,
    color: '#888',
    marginBottom: 8,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 4,
    backgroundColor: '#4D96FF',
    borderRadius: 2,
  },
  currentGame: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  currentGameName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  currentGamePlatform: {
    fontSize: 14,
    color: '#888',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  searchInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFF',
    borderWidth: 1,
    borderColor: '#333',
  },
  searchingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 8,
  },
  searchingText: {
    color: '#888',
    fontSize: 14,
  },
  noResultsText: {
    color: '#666',
    fontSize: 14,
  },
  resultsList: {
    flex: 1,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  resultImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#222',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 20,
    color: '#666',
  },
  resultInfo: {
    flex: 1,
    marginLeft: 12,
  },
  resultName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 2,
  },
  resultPlatforms: {
    fontSize: 12,
    color: '#888',
  },
  linkIcon: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4D96FF',
    paddingHorizontal: 12,
  },
  skipButton: {
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888',
  },
});

export default RawgIdMatcher;
