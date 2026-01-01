/**
 * Discovery feature type definitions
 */

/**
 * Legacy platform configuration for discovery
 */
export interface LegacyPlatform {
  id: number;
  name: string;
  shortName: string;
  color: string;
}

/**
 * Legacy platforms available for discovery
 * Platform IDs from RAWG API
 */
export const LEGACY_PLATFORMS: LegacyPlatform[] = [
  { id: 49, name: 'NES', shortName: 'NES', color: '#E60012' },
  { id: 26, name: 'Game Boy', shortName: 'GB', color: '#8B956D' },
  { id: 79, name: 'SNES', shortName: 'SNES', color: '#4F43AE' },
  { id: 83, name: 'Nintendo 64', shortName: 'N64', color: '#009E60' },
  { id: 27, name: 'PlayStation', shortName: 'PS1', color: '#003087' },
];

/**
 * Discovery flow states
 */
export type DiscoveryState =
  | 'platform_selection'
  | 'loading'
  | 'swiping'
  | 'empty'
  | 'error';

/**
 * Seen/dismissed game record
 */
export interface SeenGame {
  id: string; // Local UUID
  rawgId: number;
  platformId: number;
  dismissedAt: string; // ISO date string
}

/**
 * Game card for discovery swiping
 */
export interface DiscoveryGame {
  id: number; // RAWG game ID
  name: string;
  backgroundImage: string | null;
  released: string | null;
  genres: string[];
}

/**
 * RAWG API paginated response for games
 */
export interface GamesByPlatformResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Array<{
    id: number;
    name: string;
    background_image: string | null;
    released: string | null;
    genres: Array<{
      id: number;
      name: string;
    }>;
  }>;
}
