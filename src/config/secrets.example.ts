/**
 * Local secrets template
 * Copy this file to secrets.ts and fill in your values
 *
 * NOTE: RAWG API key is now entered by the user in-app (not in this file).
 */

// Supabase credentials (from your Supabase project settings > API)
export const SUPABASE_URL = 'https://your-project.supabase.co';
export const SUPABASE_ANON_KEY = 'your_anon_key_here';

// HotUpdater OTA endpoint
export const HOT_UPDATER_URL = 'https://your-project.supabase.co/functions/v1/hot-updater';

// Separate sync IDs for dev vs prod (so test data stays separate)
// Generate UUIDs at: https://www.uuidgenerator.net/
export const SYNC_USER_ID_DEV = 'your_dev_uuid_here';   // For simulator
export const SYNC_USER_ID_PROD = 'your_prod_uuid_here'; // For phone builds
