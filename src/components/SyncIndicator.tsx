/**
 * SyncIndicator - Shows iCloud sync status
 *
 * Displays a small indicator in the header showing:
 * - Sync in progress (spinner)
 * - Last sync time
 * - Sync errors
 */

import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import type { ICloudSyncState, ICloudSyncActions } from '../hooks/useICloudSync';

export interface SyncIndicatorProps extends ICloudSyncState, Pick<ICloudSyncActions, 'sync'> {}

function formatLastSyncTime(date: Date | null): string {
  if (!date) {
    return 'Never synced';
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    return `${diffDays}d ago`;
  }
}

export const SyncIndicator = memo(function SyncIndicator({
  isAvailable,
  isSyncing,
  lastSyncTime,
  lastSyncSuccess,
  sync,
}: SyncIndicatorProps) {
  // Don't show anything if iCloud is not available
  if (!isAvailable) {
    return (
      <View style={styles.container}>
        <Text style={styles.unavailableText}>☁️✕</Text>
      </View>
    );
  }

  const handlePress = () => {
    if (!isSyncing) {
      sync();
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      disabled={isSyncing}
      activeOpacity={0.7}
    >
      {isSyncing ? (
        <ActivityIndicator size="small" color="#4D96FF" />
      ) : (
        <View style={styles.statusContainer}>
          <Text style={[
            styles.cloudIcon,
            lastSyncSuccess === false && styles.errorIcon,
          ]}>
            {lastSyncSuccess === false ? '☁️!' : '☁️'}
          </Text>
          <Text style={styles.timeText}>
            {formatLastSyncTime(lastSyncTime)}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cloudIcon: {
    fontSize: 16,
  },
  errorIcon: {
    opacity: 0.6,
  },
  timeText: {
    fontSize: 11,
    color: '#888',
  },
  unavailableText: {
    fontSize: 14,
    color: '#666',
  },
});

export default SyncIndicator;
