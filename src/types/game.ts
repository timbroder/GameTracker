/**
 * Game type definitions
 */

export interface Game {
  id: string;                    // UUID generated locally
  rawgId: number;                // RAWG API game ID
  name: string;                  // Game title
  platform: string;              // Platform name (e.g., "PlayStation 5")
  platformId: number;            // RAWG platform ID
  boxArtUrl: string;             // URL to box art/cover image
  platformLogoUrl?: string;      // URL to platform logo (if available)
  isCompleted: boolean;          // Played status
  isShortListed?: boolean;        // In the Short List section (up to 5 games)
  isSomedayMaybe?: boolean;       // In the Someday, Maybe section
  completedDate?: string;        // ISO date string, auto-set when completed
  playtimeHours?: number;        // Optional playtime tracking
  sortOrder: number;             // Manual sort order (for unplayed games)
  dateAdded: string;             // ISO date string
  colorIndex: number;            // Index for Clear-style gradient color (0-6)
}

export interface Platform {
  id: number;
  name: string;
  slug: string;
  image?: string;
  image_background?: string;
}

export interface GameSearchResult {
  id: number;
  name: string;
  background_image: string;
  platforms: Array<{
    platform: Platform;
  }>;
}

export interface GameDetails extends GameSearchResult {
  description_raw: string;
  metacritic?: number;
  released?: string;
  genres: Array<{
    id: number;
    name: string;
  }>;
}
