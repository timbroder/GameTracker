// Test helpers and utilities

import { Game } from '../../types/game';

/**
 * Create a mock game for testing
 */
export const createMockGame = (overrides?: Partial<Game>): Game => ({
  id: 'test-game-1',
  rawgId: 3498,
  name: 'Grand Theft Auto V',
  platform: 'PlayStation 5',
  platformId: 187,
  boxArtUrl: 'https://media.rawg.io/media/games/456/456dea5e1c7e3cd07060c14e96612001.jpg',
  isCompleted: false,
  sortOrder: 0,
  dateAdded: '2025-12-12T00:00:00.000Z',
  colorIndex: 0,
  ...overrides,
});

/**
 * Create multiple mock games
 */
export const createMockGames = (count: number): Game[] => {
  return Array.from({ length: count }, (_, i) =>
    createMockGame({
      id: `test-game-${i + 1}`,
      rawgId: 1000 + i,
      name: `Test Game ${i + 1}`,
      sortOrder: i,
      colorIndex: i % 7,
    })
  );
};

/**
 * Create a mock completed game
 */
export const createMockCompletedGame = (overrides?: Partial<Game>): Game => ({
  ...createMockGame(),
  isCompleted: true,
  completedDate: '2025-12-10T00:00:00.000Z',
  ...overrides,
});

/**
 * Wait for a specific amount of time (for async operations)
 */
export const wait = (ms: number = 0): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Flush all pending promises
 */
export const flushPromises = (): Promise<void> => {
  return new Promise(resolve => setImmediate(resolve));
};
