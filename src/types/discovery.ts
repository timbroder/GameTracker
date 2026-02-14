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
  // 1980s–90s
  { id: 49, name: 'NES', shortName: 'NES', color: '#E60012' },
  { id: 167, name: 'Genesis', shortName: 'Genesis', color: '#17569B' },
  { id: 26, name: 'Game Boy', shortName: 'GB', color: '#8B956D' },
  { id: 79, name: 'SNES', shortName: 'SNES', color: '#4F43AE' },
  { id: 27, name: 'PlayStation', shortName: 'PS1', color: '#003087' },
  { id: 83, name: 'Nintendo 64', shortName: 'N64', color: '#009E60' },
  { id: 106, name: 'Dreamcast', shortName: 'DC', color: '#FF6B00' },
  { id: 24, name: 'Game Boy Advance', shortName: 'GBA', color: '#4B0082' },
  // 2000s
  { id: 15, name: 'PlayStation 2', shortName: 'PS2', color: '#00439C' },
  { id: 105, name: 'GameCube', shortName: 'GCN', color: '#663399' },
  { id: 80, name: 'Xbox', shortName: 'Xbox', color: '#107C10' },
  { id: 9, name: 'Nintendo DS', shortName: 'DS', color: '#A0A0A0' },
  { id: 14, name: 'Xbox 360', shortName: '360', color: '#9BC848' },
  { id: 11, name: 'Wii', shortName: 'Wii', color: '#00A4E4' },
  { id: 16, name: 'PlayStation 3', shortName: 'PS3', color: '#0A1E3D' },
  // 2010s–now
  { id: 8, name: 'Nintendo 3DS', shortName: '3DS', color: '#CE1126' },
  { id: 18, name: 'PlayStation 4', shortName: 'PS4', color: '#003791' },
  { id: 1, name: 'Xbox One', shortName: 'XB1', color: '#2D7D2D' },
  { id: 7, name: 'Nintendo Switch', shortName: 'Switch', color: '#E60012' },
  { id: 187, name: 'PlayStation 5', shortName: 'PS5', color: '#0070D1' },
  { id: 186, name: 'Xbox Series S/X', shortName: 'XSX', color: '#1A7A1A' },
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
  name?: string; // Game name for cross-platform duplicate filtering (optional for backwards compatibility)
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
