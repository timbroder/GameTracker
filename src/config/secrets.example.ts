/**
 * Local secrets template
 * Copy this file to secrets.ts and fill in your values
 */

export const RAWG_API_KEY = 'your_rawg_api_key_here';

// Supabase credentials (from your Supabase project settings > API)
export const SUPABASE_URL = 'https://your-project.supabase.co';
export const SUPABASE_ANON_KEY = 'your_anon_key_here';

// Separate sync IDs for dev vs prod (so test data stays separate)
// Generate UUIDs at: https://www.uuidgenerator.net/
export const SYNC_USER_ID_DEV = 'your_dev_uuid_here';   // For simulator
export const SYNC_USER_ID_PROD = 'your_prod_uuid_here'; // For phone builds
