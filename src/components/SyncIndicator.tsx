/**
 * SyncIndicator - Shows sync status in the header
 *
 * Displays:
 * - Cloud icon with checkmark when synced
 * - Spinning indicator when syncing
 * - Error state when sync failed
 * - Tap to manually trigger sync
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

export interface SyncIndicatorProps {
  /** Whether Supabase is available */
  isAvailable: boolean;
  /** Whether sync is in progress */
  isSyncing: boolean;
  /** Last successful sync time */
  lastSyncTime: Date | null;
  /** Whether last sync was successful */
  lastSyncSuccess: boolean | null;
  /** Last sync message */
  lastSyncMessage: string | null;
  /** Message if Supabase is unavailable */
  availabilityMessage: string | null;
  /** Trigger manual sync */
  sync: () => Promise<void>;
}

function formatLastSync(date: Date | null): string {
  if (!date) return 'Never synced';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export function SyncIndicator({
  isAvailable,
  isSyncing,
  lastSyncTime,
  lastSyncSuccess,
  lastSyncMessage,
  availabilityMessage,
  sync,
}: SyncIndicatorProps) {
  const handlePress = useCallback(() => {
    if (!isSyncing) {
      sync();
    }
  }, [isSyncing, sync]);

  // Determine display state
  const getStatusColor = () => {
    if (!isAvailable) return '#666'; // Gray - unavailable
    if (isSyncing) return '#007AFF'; // Blue - syncing
    if (lastSyncSuccess === false) return '#FF3B30'; // Red - error
    if (lastSyncSuccess === true) return '#34C759'; // Green - success
    return '#666'; // Gray - unknown
  };

  const getStatusIcon = () => {
    if (isSyncing) {
      return <ActivityIndicator size="small" color="#fff" />;
    }
    if (!isAvailable) {
      return <Text style={styles.icon}>!</Text>;
    }
    if (lastSyncSuccess === false) {
      return <Text style={styles.icon}>!</Text>;
    }
    return <Text style={styles.icon}>{'<>'}</Text>;
  };

  const getStatusText = () => {
    if (!isAvailable) {
      return availabilityMessage || 'Not configured';
    }
    if (isSyncing) {
      return 'Syncing...';
    }
    if (lastSyncSuccess === false) {
      return lastSyncMessage || 'Sync failed';
    }
    return formatLastSync(lastSyncTime);
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      disabled={isSyncing}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: getStatusColor() }]}>
        {getStatusIcon()}
      </View>
      <Text style={styles.text} numberOfLines={1}>
        {getStatusText()}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  icon: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  text: {
    color: '#999',
    fontSize: 12,
    maxWidth: 120,
  },
});

export default SyncIndicator;
