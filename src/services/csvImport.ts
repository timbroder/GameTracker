/**
 * CSV Import Service
 *
 * Parses a CSV file (matching the export format) and imports games,
 * fetching box art from RAWG when possible.
 */

import RNFS from 'react-native-fs';
import { v4 as uuidv4 } from 'uuid';
import { loadGames, saveGames } from './storage';
import { getGameDetails } from './rawgApi';
import type { Game } from '../types';

export interface ImportResult {
  imported: number;
  skipped: number;
  failed: number;
}

export interface RefreshResult {
  refreshed: number;
  failed: number;
  total: number;
}

/**
 * Known platform name → RAWG platform ID mapping.
 * Used as fallback when RAWG API lookup fails.
 */
const PLATFORM_NAME_TO_ID: Record<string, number> = {
  'nes': 49,
  'game boy': 26,
  'game boy color': 43,
  'game boy advance': 24,
  'snes': 79,
  'super nintendo': 79,
  'nintendo 64': 83,
  'n64': 83,
  'gamecube': 105,
  'wii': 11,
  'wii u': 10,
  'nintendo switch': 7,
  'nintendo 3ds': 8,
  'nintendo ds': 9,
  'playstation': 27,
  'ps1': 27,
  'playstation 2': 15,
  'ps2': 15,
  'playstation 3': 16,
  'ps3': 16,
  'playstation 4': 18,
  'ps4': 18,
  'playstation 5': 187,
  'ps5': 187,
  'psp': 17,
  'ps vita': 19,
  'xbox': 80,
  'xbox 360': 14,
  'xbox one': 1,
  'xbox series s/x': 186,
  'xbox series x': 186,
  'pc': 4,
  'macos': 5,
  'linux': 6,
  'ios': 3,
  'android': 21,
};

/**
 * Look up a RAWG platform ID from a platform name string.
 */
function lookupPlatformId(platformName: string): number {
  return PLATFORM_NAME_TO_ID[platformName.toLowerCase().trim()] ?? 0;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Normalize a file URI from document picker for RNFS.
 * Decodes percent-encoded characters and strips file:// prefix.
 */
function normalizeFilePath(uri: string): string {
  let path = decodeURIComponent(uri);
  if (path.startsWith('file://')) {
    path = path.slice(7);
  }
  return path;
}

/**
 * Parse a CSV string into rows of field arrays.
 * Handles quoted fields containing commas, newlines, and escaped quotes.
 */
export function parseCSV(csv: string): string[][] {
  const rows: string[][] = [];
  let current = '';
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];

    if (inQuotes) {
      if (char === '"') {
        // Check for escaped quote ("")
        if (i + 1 < csv.length && csv[i + 1] === '"') {
          current += '"';
          i++; // skip next quote
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(current);
        current = '';
      } else if (char === '\n' || (char === '\r' && csv[i + 1] === '\n')) {
        row.push(current);
        current = '';
        if (row.some((field) => field.trim() !== '')) {
          rows.push(row);
        }
        row = [];
        if (char === '\r') {
          i++; // skip \n in \r\n
        }
      } else {
        current += char;
      }
    }
  }

  // Push last field and row
  row.push(current);
  if (row.some((field) => field.trim() !== '')) {
    rows.push(row);
  }

  return rows;
}

/**
 * Parse a date string like "Jan 15, 2025" back to ISO format.
 * Returns undefined if parsing fails.
 */
function parseDateString(dateStr: string): string | undefined {
  if (!dateStr || !dateStr.trim()) {
    return undefined;
  }
  try {
    const date = new Date(dateStr.trim());
    if (isNaN(date.getTime())) {
      return undefined;
    }
    return date.toISOString();
  } catch {
    return undefined;
  }
}

const NUM_COLORS = 7;
const RAWG_DELAY_MS = 300;

/**
 * Import games from a CSV file path.
 *
 * 1. Reads and parses the CSV
 * 2. Deduplicates against existing games (by rawgId + platform)
 * 3. Fetches box art from RAWG for each new game (with delay to avoid rate limits)
 * 4. Saves appended games
 */
export async function importGamesFromCSV(
  filePath: string,
): Promise<ImportResult> {
  // Normalize the file URI from document picker
  const normalizedPath = normalizeFilePath(filePath);
  const csvContent = await RNFS.readFile(normalizedPath, 'utf8');
  const rows = parseCSV(csvContent);

  if (rows.length < 2) {
    throw new Error('CSV file is empty or has no data rows');
  }

  // Validate header row
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const nameIdx = headers.indexOf('name');
  const platformIdx = headers.indexOf('platform');
  const statusIdx = headers.indexOf('status');
  const completedDateIdx = headers.indexOf('completed date');
  const dateAddedIdx = headers.indexOf('date added');
  const playtimeIdx = headers.indexOf('playtime hours');
  const rawgIdIdx = headers.indexOf('rawg id');

  if (nameIdx === -1 || platformIdx === -1) {
    throw new Error(
      'CSV is missing required columns: Name and Platform are required',
    );
  }

  // Load existing games for dedup
  const existingGames = await loadGames();
  const existingKeys = new Set(
    existingGames.map((g) => `${g.rawgId}:${g.platform.toLowerCase()}`),
  );

  const dataRows = rows.slice(1);
  let imported = 0;
  let skipped = 0;
  let failed = 0;

  const newGames: Game[] = [];
  let nextSortOrder =
    existingGames.length > 0
      ? Math.max(...existingGames.filter((g) => !g.isCompleted).map((g) => g.sortOrder), -1) + 1
      : 0;
  let nextColorIndex =
    existingGames.length > 0
      ? (Math.max(...existingGames.map((g) => g.colorIndex)) + 1) % NUM_COLORS
      : 0;

  for (const row of dataRows) {
    try {
      const name = row[nameIdx]?.trim();
      const platform = row[platformIdx]?.trim();

      if (!name || !platform) {
        failed++;
        continue;
      }

      const rawgIdStr = rawgIdIdx !== -1 ? row[rawgIdIdx]?.trim() : '';
      const rawgId = rawgIdStr ? parseInt(rawgIdStr, 10) : 0;
      const statusStr = statusIdx !== -1 ? row[statusIdx]?.trim() : '';
      const isCompleted = statusStr.toLowerCase() === 'completed';
      const completedDateStr =
        completedDateIdx !== -1 ? row[completedDateIdx]?.trim() : '';
      const dateAddedStr =
        dateAddedIdx !== -1 ? row[dateAddedIdx]?.trim() : '';
      const playtimeStr = playtimeIdx !== -1 ? row[playtimeIdx]?.trim() : '';
      const playtimeHours = playtimeStr ? parseFloat(playtimeStr) : undefined;

      // Deduplicate by rawgId + platform
      if (rawgId) {
        const key = `${rawgId}:${platform.toLowerCase()}`;
        if (existingKeys.has(key)) {
          skipped++;
          continue;
        }
        // Also check against games we're importing in this batch
        const alreadyImporting = newGames.some(
          (g) => g.rawgId === rawgId && g.platform.toLowerCase() === platform.toLowerCase(),
        );
        if (alreadyImporting) {
          skipped++;
          continue;
        }
      }

      let boxArtUrl = '';
      let platformId = lookupPlatformId(platform);
      let platformLogoUrl: string | undefined;

      // Try to fetch from RAWG for box art (with delay to avoid rate limits)
      if (rawgId) {
        try {
          await sleep(RAWG_DELAY_MS);
          const details = await getGameDetails(rawgId);
          boxArtUrl = details.background_image || '';

          // Find matching platform from RAWG response
          const matchedPlatform = details.platforms?.find(
            (p) => p.platform.name.toLowerCase() === platform.toLowerCase(),
          );
          if (matchedPlatform) {
            platformId = matchedPlatform.platform.id;
            platformLogoUrl =
              matchedPlatform.platform.image_background || undefined;
          }
        } catch {
          // RAWG lookup failed — continue with CSV-only data
        }
      }

      const game: Game = {
        id: uuidv4(),
        rawgId: rawgId || 0,
        name,
        platform,
        platformId,
        boxArtUrl,
        platformLogoUrl,
        isCompleted,
        completedDate: isCompleted
          ? parseDateString(completedDateStr) || new Date().toISOString()
          : undefined,
        playtimeHours:
          playtimeHours !== undefined && !isNaN(playtimeHours)
            ? playtimeHours
            : undefined,
        sortOrder: isCompleted ? 0 : nextSortOrder++,
        dateAdded: parseDateString(dateAddedStr) || new Date().toISOString(),
        colorIndex: nextColorIndex,
      };

      nextColorIndex = (nextColorIndex + 1) % NUM_COLORS;
      newGames.push(game);
      existingKeys.add(`${rawgId}:${platform.toLowerCase()}`);
      imported++;
    } catch {
      failed++;
    }
  }

  // Save all games
  if (newGames.length > 0) {
    const allGames = [...existingGames, ...newGames];
    await saveGames(allGames);
  }

  return { imported, skipped, failed };
}

/**
 * Refresh box art for all games by re-fetching from RAWG.
 * Clears existing image URLs first, then fetches fresh ones.
 */
export async function refreshAllImages(): Promise<RefreshResult> {
  const games = await loadGames();
  const gamesWithRawgId = games.filter((g) => g.rawgId > 0);

  let refreshed = 0;
  let failed = 0;

  for (const game of games) {
    if (game.rawgId <= 0) {
      continue;
    }

    try {
      await sleep(RAWG_DELAY_MS);
      const details = await getGameDetails(game.rawgId);
      game.boxArtUrl = details.background_image || '';

      const matchedPlatform = details.platforms?.find(
        (p) => p.platform.name.toLowerCase() === game.platform.toLowerCase(),
      );
      if (matchedPlatform) {
        game.platformId = matchedPlatform.platform.id;
        game.platformLogoUrl =
          matchedPlatform.platform.image_background || undefined;
      }

      refreshed++;
    } catch {
      failed++;
    }
  }

  await saveGames(games);

  return { refreshed, failed, total: gamesWithRawgId.length };
}
