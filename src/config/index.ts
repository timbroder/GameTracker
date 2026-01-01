/**
 * App configuration
 */

import { RAWG_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY, SYNC_USER_ID_DEV, SYNC_USER_ID_PROD } from './secrets';

/**
 * App version - bump this when deploying OTA updates
 */
export const APP_VERSION = '1.0.0';

let rawgApiKey: string | null = RAWG_API_KEY;

/**
 * Get Supabase configuration
 */
export function getSupabaseConfig(): { url: string; anonKey: string } {
  return {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
  };
}

/**
 * Get the sync user ID based on environment
 * - Dev/Simulator: uses SYNC_USER_ID_DEV
 * - Production: uses SYNC_USER_ID_PROD
 */
export function getSyncUserId(): string {
  return __DEV__ ? SYNC_USER_ID_DEV : SYNC_USER_ID_PROD;
}

/**
 * Initialize app configuration
 * Call this on app startup with your RAWG API key
 */
export function initializeConfig(config: { rawgApiKey: string }): void {
  rawgApiKey = config.rawgApiKey;
}

/**
 * Get the RAWG API key
 */
export function getRawgApiKey(): string | null {
  return rawgApiKey;
}

/**
 * Check if config is initialized
 */
export function isConfigInitialized(): boolean {
  return rawgApiKey !== null;
}
