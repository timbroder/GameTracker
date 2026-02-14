/**
 * CSV Export Service
 *
 * Generates CSV from games data and shares via native share sheet.
 */

import Share from 'react-native-share';
import RNFS from 'react-native-fs';
import { loadGames } from './storage';
import type { Game } from '../types';

/**
 * Escape a value for CSV (wrap in quotes if contains comma, quote, or newline)
 */
function escapeCSV(value: string | number | undefined | null): string {
  if (value === undefined || value === null) {
    return '';
  }
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Format a date string for CSV (readable format)
 */
function formatDate(isoDate: string | undefined): string {
  if (!isoDate) return '';
  try {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return isoDate;
  }
}

/**
 * Generate CSV content from games
 */
export function generateCSV(games: Game[]): string {
  const headers = [
    'Name',
    'Platform',
    'Status',
    'Completed Date',
    'Date Added',
    'Playtime Hours',
    'RAWG ID',
  ];

  const rows = games.map((game) => [
    escapeCSV(game.name),
    escapeCSV(game.platform),
    game.isCompleted ? 'Completed' : 'To Play',
    escapeCSV(formatDate(game.completedDate)),
    escapeCSV(formatDate(game.dateAdded)),
    escapeCSV(game.playtimeHours),
    escapeCSV(game.rawgId),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Generate filename with current date
 */
function getFileName(): string {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  return `GameTracker_Export_${dateStr}.csv`;
}

/**
 * Export all games to CSV and open share sheet
 */
export async function exportAndShareCSV(): Promise<void> {
  // Load all games
  const games = await loadGames();

  if (games.length === 0) {
    throw new Error('No games to export');
  }

  // Generate CSV content
  const csvContent = generateCSV(games);

  // Write to temp file
  const fileName = getFileName();
  const filePath = `${RNFS.CachesDirectoryPath}/${fileName}`;

  await RNFS.writeFile(filePath, csvContent, 'utf8');

  try {
    // Share the file
    await Share.open({
      url: `file://${filePath}`,
      type: 'text/csv',
      filename: fileName,
    });
  } finally {
    // Clean up temp file after sharing (whether successful or cancelled)
    try {
      await RNFS.unlink(filePath);
    } catch {
      // Ignore cleanup errors
    }
  }
}
