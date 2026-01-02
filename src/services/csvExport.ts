/**
 * CSV Export Service
 *
 * Generates CSV from games data and shares via native share sheet.
 */

import Share from 'react-native-share';
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
    formatDate(game.completedDate),
    formatDate(game.dateAdded),
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
 * Convert string to base64
 */
function toBase64(str: string): string {
  // Using a simple approach that works in React Native
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';

  // Convert to UTF-8 bytes
  const utf8 = unescape(encodeURIComponent(str));

  for (let i = 0; i < utf8.length; i += 3) {
    const chr1 = utf8.charCodeAt(i);
    const chr2 = i + 1 < utf8.length ? utf8.charCodeAt(i + 1) : NaN;
    const chr3 = i + 2 < utf8.length ? utf8.charCodeAt(i + 2) : NaN;

    const enc1 = chr1 >> 2;
    const enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
    const enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
    const enc4 = chr3 & 63;

    output += chars.charAt(enc1) + chars.charAt(enc2);
    output += isNaN(chr2) ? '=' : chars.charAt(enc3);
    output += isNaN(chr3) ? '=' : chars.charAt(enc4);
  }

  return output;
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

  // Convert to base64 for sharing
  const base64Content = toBase64(csvContent);
  const fileName = getFileName();

  // Share the file using base64 data URL
  await Share.open({
    url: `data:text/csv;base64,${base64Content}`,
    filename: fileName,
    type: 'text/csv',
    title: 'Export Games',
    subject: 'GameTracker Export',
  });
}
