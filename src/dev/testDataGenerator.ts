/**
 * Test Data Generator - Creates mock games for performance testing
 *
 * Usage:
 *   import { generateTestGames, populateTestData, clearTestData } from './dev/testDataGenerator';
 *
 *   // Generate 100 mock games and save to storage
 *   await populateTestData(100);
 *
 *   // Clear all games
 *   await clearTestData();
 */

import { v4 as uuidv4 } from 'uuid';
import type { Game } from '../types';
import { saveGames, loadGames } from '../services/storage';

// Sample game names for realistic test data
const GAME_TITLES = [
  'The Legend of Zelda', 'Super Mario', 'Final Fantasy', 'Dark Souls',
  'Elden Ring', 'God of War', 'Horizon', 'Spider-Man', 'Ghost of Tsushima',
  'Uncharted', 'The Last of Us', 'Resident Evil', 'Metal Gear Solid',
  'Assassin\'s Creed', 'Red Dead Redemption', 'Grand Theft Auto', 'Cyberpunk',
  'Witcher', 'Mass Effect', 'Dragon Age', 'Fallout', 'Elder Scrolls',
  'Halo', 'Gears of War', 'Forza', 'Call of Duty', 'Battlefield',
  'Destiny', 'Diablo', 'World of Warcraft', 'Starcraft', 'Overwatch',
  'Pokemon', 'Animal Crossing', 'Fire Emblem', 'Metroid', 'Kirby',
  'Sonic the Hedgehog', 'Persona', 'Kingdom Hearts', 'Monster Hunter',
  'Devil May Cry', 'Bayonetta', 'NieR', 'Sekiro', 'Bloodborne',
  'Demon\'s Souls', 'Ratchet & Clank', 'Sackboy', 'Astro Bot', 'Returnal',
];

const GAME_SUBTITLES = [
  '', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
  ': Remastered', ': Definitive Edition', ': Game of the Year',
  ': Origins', ': Odyssey', ': Valhalla', ': Ragnarok', ': Rebirth',
  ': Wild Hunt', ': Automata', ': Remake', ': Intergrade', ': Royal',
  ' Infinite', ' Eternal', ' Ultimate', ' Legends', ' Chronicles',
];

const PLATFORMS = [
  { id: 187, name: 'PlayStation 5' },
  { id: 18, name: 'PlayStation 4' },
  { id: 1, name: 'Xbox One' },
  { id: 186, name: 'Xbox Series S/X' },
  { id: 7, name: 'Nintendo Switch' },
  { id: 4, name: 'PC' },
  { id: 21, name: 'Android' },
  { id: 3, name: 'iOS' },
];

// Sample box art URLs (using placeholder images)
const BOX_ART_URLS = [
  'https://media.rawg.io/media/games/456/456dea5e1c7e3cd07060c14e96612001.jpg',
  'https://media.rawg.io/media/games/618/618c2031a07bbff6b4f611f10b6571c8.jpg',
  'https://media.rawg.io/media/games/4be/4be6a6ad0364751a96229c56bf69be59.jpg',
  'https://media.rawg.io/media/games/b45/b45575f34285f2c4479c9a5f719d972e.jpg',
  'https://media.rawg.io/media/games/021/021c4e21a1824d2526f925edd27ec2e2.jpg',
  'https://media.rawg.io/media/games/f24/f2493ea338fe7bd3c7d73750a85a0959.jpg',
  'https://media.rawg.io/media/games/713/713269608dc8f2f40f5a670a14b2de94.jpg',
  'https://media.rawg.io/media/games/490/49016e06ae2103881ff6373248843571.jpg',
  'https://media.rawg.io/media/games/942/9424d6bb763dc38d9378b488603c87fa.jpg',
  'https://media.rawg.io/media/games/c4b/c4b0cab189e73432de3a250d8cf1c84e.jpg',
];

/**
 * Generate a random game name
 */
function generateGameName(): string {
  const title = GAME_TITLES[Math.floor(Math.random() * GAME_TITLES.length)];
  const subtitle = GAME_SUBTITLES[Math.floor(Math.random() * GAME_SUBTITLES.length)];
  return `${title}${subtitle}`;
}

/**
 * Generate a random date within the last year
 */
function generateRandomDate(daysBack: number = 365): string {
  const now = new Date();
  const randomDays = Math.floor(Math.random() * daysBack);
  const date = new Date(now.getTime() - randomDays * 24 * 60 * 60 * 1000);
  return date.toISOString();
}

/**
 * Generate a single mock game
 */
export function generateMockGame(index: number, isCompleted: boolean = false): Game {
  const platform = PLATFORMS[Math.floor(Math.random() * PLATFORMS.length)];
  const boxArtUrl = BOX_ART_URLS[Math.floor(Math.random() * BOX_ART_URLS.length)];

  const game: Game = {
    id: uuidv4(),
    rawgId: 10000 + index,
    name: generateGameName(),
    platform: platform.name,
    platformId: platform.id,
    boxArtUrl,
    isCompleted,
    sortOrder: index,
    dateAdded: generateRandomDate(),
    colorIndex: index % 7,
  };

  if (isCompleted) {
    game.completedDate = generateRandomDate(180); // Completed within last 6 months
    game.playtimeHours = Math.floor(Math.random() * 100) + 5;
  }

  return game;
}

/**
 * Generate multiple mock games
 */
export function generateTestGames(count: number, completedRatio: number = 0.3): Game[] {
  const games: Game[] = [];
  const completedCount = Math.floor(count * completedRatio);

  // Generate uncompleted games
  for (let i = 0; i < count - completedCount; i++) {
    games.push(generateMockGame(i, false));
  }

  // Generate completed games
  for (let i = 0; i < completedCount; i++) {
    games.push(generateMockGame(count - completedCount + i, true));
  }

  return games;
}

/**
 * Populate storage with test games
 */
export async function populateTestData(count: number = 100): Promise<Game[]> {
  const games = generateTestGames(count);
  await saveGames(games);
  console.log(`[TestData] Populated ${games.length} test games`);
  return games;
}

/**
 * Add test games to existing games
 */
export async function addTestGames(count: number = 50): Promise<Game[]> {
  const existingGames = await loadGames();
  const newGames = generateTestGames(count);

  // Adjust sort orders for new games
  const maxSortOrder = existingGames.reduce((max, g) => Math.max(max, g.sortOrder), -1);
  newGames.forEach((game, i) => {
    if (!game.isCompleted) {
      game.sortOrder = maxSortOrder + 1 + i;
    }
  });

  const allGames = [...existingGames, ...newGames];
  await saveGames(allGames);
  console.log(`[TestData] Added ${count} test games (total: ${allGames.length})`);
  return allGames;
}

/**
 * Clear all games from storage
 */
export async function clearTestData(): Promise<void> {
  await saveGames([]);
  console.log('[TestData] Cleared all games');
}

/**
 * Get current game count
 */
export async function getGameCount(): Promise<number> {
  const games = await loadGames();
  return games.length;
}
