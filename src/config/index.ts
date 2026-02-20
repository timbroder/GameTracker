/**
 * App configuration
 */

import { SUPABASE_URL, SUPABASE_ANON_KEY, SYNC_USER_ID_DEV, SYNC_USER_ID_PROD, HOT_UPDATER_URL } from './secrets';

export { HOT_UPDATER_URL };

/**
 * App version - bump this when deploying OTA updates
 */
export const APP_VERSION = '1.0.54';

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
