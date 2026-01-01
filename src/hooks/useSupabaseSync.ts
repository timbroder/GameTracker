/**
 * useSupabaseSync - Hook for managing Supabase sync
 *
 * Handles:
 * - Initial sync on app launch
 * - Sync when app comes to foreground
 * - Manual sync trigger
 * - Debounced sync after changes
 * - Sync status tracking
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  syncGames,
  checkSupabaseAvailability,
  forceUploadToCloud,
  forceDownloadFromCloud,
  getLastSyncTimestampAsync,
  setLastSyncTimestamp,
} from '../services/supabaseSync';

export interface SupabaseSyncState {
  /** Whether Supabase is available and configured */
  isAvailable: boolean;
  /** Whether a sync is currently in progress */
  isSyncing: boolean;
  /** The last sync result message */
  lastSyncMessage: string | null;
  /** The last sync timestamp */
  lastSyncTime: Date | null;
  /** Whether the last sync was successful */
  lastSyncSuccess: boolean | null;
  /** Error message if Supabase is not available */
  availabilityMessage: string | null;
}

export interface SupabaseSyncActions {
  /** Trigger a manual sync */
  sync: () => Promise<void>;
  /** Trigger a debounced sync after local data changes */
  syncAfterChange: () => void;
  /** Force upload local data to Supabase */
  forceUpload: () => Promise<void>;
  /** Force download data from Supabase */
  forceDownload: () => Promise<void>;
  /** Refresh Supabase availability status */
  checkAvailability: () => Promise<void>;
}

export type UseSupabaseSyncReturn = SupabaseSyncState & SupabaseSyncActions;

interface UseSupabaseSyncOptions {
  /** Whether to sync automatically on app launch (default: true) */
  syncOnLaunch?: boolean;
  /** Whether to sync when app comes to foreground (default: true) */
  syncOnForeground?: boolean;
  /** Debounce delay for syncAfterChange in ms (default: 2000) */
  debounceDelay?: number;
  /** Callback when games are updated from cloud */
  onGamesUpdated?: () => void;
}

export function useSupabaseSync(options: UseSupabaseSyncOptions = {}): UseSupabaseSyncReturn {
  const {
    syncOnLaunch = true,
    syncOnForeground = true,
    debounceDelay = 2000,
    onGamesUpdated,
  } = options;

  const [isAvailable, setIsAvailable] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncMessage, setLastSyncMessage] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [lastSyncSuccess, setLastSyncSuccess] = useState<boolean | null>(null);
  const [availabilityMessage, setAvailabilityMessage] = useState<string | null>(null);

  const hasInitialized = useRef(false);
  const appState = useRef(AppState.currentState);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check Supabase availability
  const checkAvailability = useCallback(async () => {
    const result = await checkSupabaseAvailability();
    setIsAvailable(result.available);
    setAvailabilityMessage(result.available ? null : result.message);
  }, []);

  // Perform sync
  const sync = useCallback(async () => {
    if (isSyncing) {
      return;
    }

    setIsSyncing(true);
    try {
      const result = await syncGames();
      setLastSyncSuccess(result.success);
      setLastSyncMessage(result.message);
      setLastSyncTime(new Date());

      // If we downloaded new games, notify the caller
      if (result.success && result.gamesDownloaded && result.gamesDownloaded > 0 && onGamesUpdated) {
        onGamesUpdated();
      }
    } catch (error) {
      setLastSyncSuccess(false);
      setLastSyncMessage(error instanceof Error ? error.message : 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, onGamesUpdated]);

  // Force upload
  const forceUpload = useCallback(async () => {
    if (isSyncing) {
      return;
    }

    setIsSyncing(true);
    try {
      const result = await forceUploadToCloud();
      setLastSyncSuccess(result.success);
      setLastSyncMessage(result.message);
      setLastSyncTime(new Date());
    } catch (error) {
      setLastSyncSuccess(false);
      setLastSyncMessage(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  // Force download
  const forceDownload = useCallback(async () => {
    if (isSyncing) {
      return;
    }

    setIsSyncing(true);
    try {
      const result = await forceDownloadFromCloud();
      setLastSyncSuccess(result.success);
      setLastSyncMessage(result.message);
      setLastSyncTime(new Date());

      if (result.success && onGamesUpdated) {
        onGamesUpdated();
      }
    } catch (error) {
      setLastSyncSuccess(false);
      setLastSyncMessage(error instanceof Error ? error.message : 'Download failed');
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, onGamesUpdated]);

  // Debounced sync after local data changes
  const syncAfterChange = useCallback(() => {
    // Update local timestamp to mark that we have newer data
    setLastSyncTimestamp(Date.now());

    // Clear any pending debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Schedule sync after debounce delay
    debounceTimerRef.current = setTimeout(() => {
      sync();
    }, debounceDelay);
  }, [sync, debounceDelay]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      // Sync when app comes to foreground
      if (
        syncOnForeground &&
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        sync();
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [sync, syncOnForeground]);

  // Initial sync on mount
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;

      // Check availability first
      checkAvailability().then(() => {
        // Then sync if enabled
        if (syncOnLaunch) {
          sync();
        }
      });

      // Load last sync timestamp
      getLastSyncTimestampAsync().then((timestamp) => {
        if (timestamp > 0) {
          setLastSyncTime(new Date(timestamp));
        }
      });
    }
  }, [checkAvailability, sync, syncOnLaunch]);

  return {
    isAvailable,
    isSyncing,
    lastSyncMessage,
    lastSyncTime,
    lastSyncSuccess,
    availabilityMessage,
    sync,
    syncAfterChange,
    forceUpload,
    forceDownload,
    checkAvailability,
  };
}

export default useSupabaseSync;
