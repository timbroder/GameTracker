/**
 * Settings Screen
 *
 * Provides app settings including CSV export functionality.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { APP_VERSION, getSyncUserId } from '../config';
import { exportAndShareCSV } from '../services/csvExport';
import { importGamesFromCSV, refreshAllImages } from '../services/csvImport';
import { useSupabaseSync } from '../hooks';
import { RawgIdMatcher } from '../components';
import { pick, types } from 'react-native-document-picker';
import * as gameManager from '../services/gameManager';
import { saveGames } from '../services/storage';
import { setApiKey } from '../services/rawgApi';
import { STORAGE_KEYS } from '../types/storage';

export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [matcherVisible, setMatcherVisible] = useState(false);
  const [unmatchedCount, setUnmatchedCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      gameManager.getGames().then(games => {
        setUnmatchedCount(games.filter(g => g.rawgId === 0).length);
      });
    }, []),
  );

  const {
    isAvailable,
    isSyncing,
    lastSyncTime,
    lastSyncSuccess,
    sync,
  } = useSupabaseSync();

  const formatLastSync = () => {
    if (!lastSyncTime) return 'Never';
    const now = new Date();
    const diff = now.getTime() - lastSyncTime.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return lastSyncTime.toLocaleDateString();
  };

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      await exportAndShareCSV();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to export games';
      // Don't show error for user cancellation
      if (!message.includes('User did not share')) {
        Alert.alert('Export Failed', message);
      }
    } finally {
      setIsExporting(false);
    }
  }, []);

  const handleImport = useCallback(async () => {
    try {
      const [result] = await pick({ type: [types.csv] });
      if (!result?.uri) {
        return;
      }

      setIsImporting(true);
      const importResult = await importGamesFromCSV(result.uri);

      Alert.alert(
        'Import Complete',
        `Imported: ${importResult.imported}\nSkipped (duplicates): ${importResult.skipped}${importResult.failed > 0 ? `\nFailed: ${importResult.failed}` : ''}`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to import games';
      // Don't show error for user cancellation
      if (!message.includes('cancel')) {
        Alert.alert('Import Failed', message);
      }
    } finally {
      setIsImporting(false);
    }
  }, []);

  const handleRefreshImages = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const result = await refreshAllImages();
      Alert.alert(
        'Refresh Complete',
        `Refreshed: ${result.refreshed} of ${result.total}${result.failed > 0 ? `\nFailed: ${result.failed}` : ''}`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to refresh images';
      Alert.alert('Refresh Failed', message);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {/* Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DATA</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={handleExport}
            disabled={isExporting}
            activeOpacity={0.7}
          >
            {isExporting ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Text style={styles.buttonIcon}>📤</Text>
                <Text style={styles.buttonText}>Export Games to CSV</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={handleImport}
            disabled={isImporting}
            activeOpacity={0.7}
          >
            {isImporting ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Text style={styles.buttonIcon}>📥</Text>
                <Text style={styles.buttonText}>Import Games from CSV</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={handleRefreshImages}
            disabled={isRefreshing}
            activeOpacity={0.7}
          >
            {isRefreshing ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Text style={styles.buttonIcon}>🖼️</Text>
                <Text style={styles.buttonText}>Refresh All Images</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, unmatchedCount === 0 && styles.buttonDisabled]}
            onPress={() => setMatcherVisible(true)}
            disabled={unmatchedCount === 0}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonIcon}>🔗</Text>
            <Text style={styles.buttonText}>Match RAWG IDs</Text>
            {unmatchedCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unmatchedCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={() => {
              Alert.alert(
                'Delete All Games',
                'This will permanently remove all games from the app. This cannot be undone. Export first if you want a backup.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete All',
                    style: 'destructive',
                    onPress: async () => {
                      await saveGames([]);
                      setUnmatchedCount(0);
                      Alert.alert('Done', 'All games have been deleted.');
                    },
                  },
                ],
              );
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonIcon}>🗑️</Text>
            <Text style={styles.dangerButtonText}>Delete All Data</Text>
          </TouchableOpacity>
          <Text style={styles.hint}>
            Export or import games as CSV files. Duplicates are automatically
            skipped during import. Refresh images re-downloads all box art from
            RAWG. Match RAWG IDs links imported games to RAWG for image support.
          </Text>
        </View>

        {/* Sync Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SYNC</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={sync}
            disabled={isSyncing || !isAvailable}
            activeOpacity={0.7}
          >
            {isSyncing ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Text style={styles.buttonIcon}>☁️</Text>
                <Text style={styles.buttonText}>Sync Now</Text>
              </>
            )}
          </TouchableOpacity>
          <View style={styles.syncStatus}>
            <View style={styles.syncStatusRow}>
              <Text style={styles.syncLabel}>Status</Text>
              <View style={styles.syncValueRow}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: !isAvailable
                        ? '#666'
                        : lastSyncSuccess === null
                        ? '#666'
                        : lastSyncSuccess
                        ? '#4ECB71'
                        : '#FF6B6B',
                    },
                  ]}
                />
                <Text style={styles.syncValue}>
                  {!isAvailable
                    ? 'Not connected'
                    : isSyncing
                    ? 'Syncing...'
                    : lastSyncSuccess
                    ? 'Connected'
                    : 'Error'}
                </Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.syncStatusRow}>
              <Text style={styles.syncLabel}>Last sync</Text>
              <Text style={styles.syncValue}>{formatLastSync()}</Text>
            </View>
          </View>
        </View>

        {/* API Key Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>API KEY</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              Alert.prompt(
                'Change RAWG API Key',
                'Enter your new RAWG API key. Get one free at rawg.io/apidocs',
                async (newKey) => {
                  if (!newKey?.trim()) return;
                  const trimmed = newKey.trim();
                  try {
                    const response = await fetch(
                      `https://api.rawg.io/api/games?key=${trimmed}&page_size=1`,
                    );
                    if (response.status === 401) {
                      Alert.alert('Invalid Key', 'That API key was not accepted by RAWG.');
                      return;
                    }
                    await AsyncStorage.setItem(STORAGE_KEYS.RAWG_API_KEY, trimmed);
                    setApiKey(trimmed);
                    Alert.alert('Updated', 'RAWG API key has been updated.');
                  } catch {
                    Alert.alert('Error', 'Could not validate key. Check your connection.');
                  }
                },
                'plain-text',
              );
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonIcon}>🔑</Text>
            <Text style={styles.buttonText}>Change RAWG API Key</Text>
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ABOUT</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>{APP_VERSION}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Sync ID</Text>
            <Text style={styles.infoValue} selectable>{getSyncUserId()}</Text>
          </View>
        </View>
      </ScrollView>

      <RawgIdMatcher
        visible={matcherVisible}
        onClose={() => {
          setMatcherVisible(false);
          // Refresh unmatched count
          gameManager.getGames().then(games => {
            setUnmatchedCount(games.filter(g => g.rawgId === 0).length);
          });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 32,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    letterSpacing: 1,
    marginBottom: 4,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 10,
    minHeight: 56,
  },
  buttonIcon: {
    fontSize: 18,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFF',
  },
  badge: {
    backgroundColor: '#4D96FF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a1a1a',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 10,
    minHeight: 56,
    borderWidth: 1,
    borderColor: '#4a2020',
  },
  dangerButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  hint: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: '#FFF',
  },
  infoValue: {
    fontSize: 16,
    color: '#666',
  },
  syncStatus: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
  },
  syncStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  syncLabel: {
    fontSize: 16,
    color: '#FFF',
  },
  syncValue: {
    fontSize: 16,
    color: '#666',
  },
  syncValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginHorizontal: 16,
  },
});

export default SettingsScreen;
