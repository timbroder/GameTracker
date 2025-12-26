/**
 * Test Screen - Temporary screen to verify services work
 * DELETE THIS FILE before production
 */

import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
  ActivityIndicator,
  Alert,
  useColorScheme,
} from 'react-native';
import { searchGames, getApiKey } from '../services/rawgApi';
import { addGame, getGames, deleteGame } from '../services/gameManager';
import type { GameSearchResult, Game } from '../types';

export default function TestScreen(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GameSearchResult[]>([]);
  const [savedGames, setSavedGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const backgroundColor = isDarkMode ? '#000' : '#fff';
  const textColor = isDarkMode ? '#fff' : '#000';

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const results = await searchGames(searchQuery, 5);
      setSearchResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAddGame = async (result: GameSearchResult) => {
    try {
      const platform = result.platforms?.[0]?.platform;
      if (!platform) {
        Alert.alert('Error', 'No platform found for this game');
        return;
      }

      await addGame({
        rawgId: result.id,
        name: result.name,
        platform: platform.name,
        platformId: platform.id,
        boxArtUrl: result.background_image || '',
      });

      Alert.alert('Success', `Added "${result.name}" to your list!`);
      loadSavedGames();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to add game');
    }
  };

  const loadSavedGames = async () => {
    try {
      const games = await getGames();
      setSavedGames(games);
    } catch (err) {
      console.error('Failed to load games:', err);
    }
  };

  const handleDeleteGame = async (id: string) => {
    try {
      await deleteGame(id);
      loadSavedGames();
    } catch (err) {
      Alert.alert('Error', 'Failed to delete game');
    }
  };

  React.useEffect(() => {
    loadSavedGames();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <Text style={[styles.title, { color: textColor }]}>Service Test</Text>

      {/* Search Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          1. Search RAWG API
        </Text>
        <View style={styles.searchRow}>
          <TextInput
            style={[styles.searchInput, { color: textColor, borderColor: '#666' }]}
            placeholder="Search games..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.buttonText}>Search</Text>
          </TouchableOpacity>
        </View>

        {loading && <ActivityIndicator style={styles.loader} />}
        {error && <Text style={styles.error}>{error}</Text>}

        {searchResults.length > 0 && (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id.toString()}
            style={styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.resultItem}
                onPress={() => handleAddGame(item)}
              >
                <Text style={[styles.gameName, { color: textColor }]}>
                  {item.name}
                </Text>
                <Text style={styles.platformText}>
                  {item.platforms?.map((p) => p.platform.name).join(', ') || 'Unknown'}
                </Text>
                <Text style={styles.tapHint}>Tap to add</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      {/* Saved Games Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          2. Saved Games ({savedGames.length})
        </Text>
        {savedGames.length === 0 ? (
          <Text style={styles.emptyText}>No games saved yet</Text>
        ) : (
          <FlatList
            data={savedGames}
            keyExtractor={(item) => item.id}
            style={styles.list}
            renderItem={({ item }) => (
              <View style={styles.savedItem}>
                <View style={styles.savedInfo}>
                  <Text style={[styles.gameName, { color: textColor }]}>
                    {item.name}
                  </Text>
                  <Text style={styles.platformText}>{item.platform}</Text>
                  <Text style={styles.metaText}>
                    Color: {item.colorIndex} | Order: {item.sortOrder}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteGame(item.id)}
                >
                  <Text style={styles.deleteText}>X</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 4,
  },
  hint: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#4D96FF',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  section: {
    flex: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  searchButton: {
    backgroundColor: '#4D96FF',
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
  },
  loader: {
    marginVertical: 10,
  },
  error: {
    color: '#FF6B6B',
    marginVertical: 8,
  },
  list: {
    maxHeight: 200,
  },
  resultItem: {
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  gameName: {
    fontSize: 14,
    fontWeight: '500',
  },
  platformText: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  tapHint: {
    fontSize: 10,
    color: '#4D96FF',
    marginTop: 4,
  },
  emptyText: {
    color: '#666',
    fontStyle: 'italic',
  },
  savedItem: {
    backgroundColor: '#222',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  savedInfo: {
    flex: 1,
  },
  metaText: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  deleteButton: {
    backgroundColor: '#FF6B6B',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
