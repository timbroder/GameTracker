/**
 * App configuration
 */

import { RAWG_API_KEY } from './secrets';

let rawgApiKey: string | null = RAWG_API_KEY;

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
