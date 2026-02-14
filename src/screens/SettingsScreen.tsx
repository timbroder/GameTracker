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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { APP_VERSION } from '../config';
import { exportAndShareCSV } from '../services/csvExport';
import { importGamesFromCSV, refreshAllImages } from '../services/csvImport';
import { useSupabaseSync } from '../hooks';
import { pick, types } from 'react-native-document-picker';

export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
          <Text style={styles.hint}>
            Export or import games as CSV files. Duplicates are automatically
            skipped during import. Refresh images re-downloads all box art from
            RAWG.
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

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ABOUT</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>{APP_VERSION}</Text>
          </View>
        </View>
      </ScrollView>
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
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFF',
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
