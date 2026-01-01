/**
 * App configuration
 */

import { RAWG_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY, SYNC_USER_ID } from './secrets';

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
 * Get the fixed sync user ID
 * This ID is shared across all your devices to enable sync
 */
export function getSyncUserId(): string {
  return SYNC_USER_ID;
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
