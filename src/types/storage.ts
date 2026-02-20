/**
 * Storage type definitions
 */

export const STORAGE_KEYS = {
  GAMES: '@gametracker:games',
  SEEN_GAMES: '@gametracker:seenGames',
  LAST_SYNC: '@gametracker:lastSync',
  USER_PREFS: '@gametracker:prefs',
  PENDING_DELETIONS: '@gametracker:pendingDeletions',
  RAWG_API_KEY: '@gametracker:rawg_api_key',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export type SortCompletedBy = 'completedDate' | 'name';
export type ColorScheme = 'vibrant' | 'pastel';

export interface UserPreferences {
  colorScheme: ColorScheme;
  sortCompletedBy: SortCompletedBy;
  hapticFeedbackEnabled: boolean;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  colorScheme: 'vibrant',
  sortCompletedBy: 'completedDate',
  hapticFeedbackEnabled: true,
};
