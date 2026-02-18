/**
 * Sorting utilities tests
 */

import {
  sortGames,
  getNextSortOrder,
  reorderGamesList,
  hasUnplayedGames,
  hasCompletedGames,
} from '../sorting';
import type { Game } from '../../types';

// Helper to create a mock game
function createMockGame(overrides: Partial<Game> = {}): Game {
  return {
    id: 'test-id',
    rawgId: 123,
    name: 'Test Game',
    platform: 'PlayStation 5',
    platformId: 1,
    boxArtUrl: 'https://example.com/art.jpg',
    isCompleted: false,
    sortOrder: 0,
    dateAdded: '2024-01-01T00:00:00Z',
    colorIndex: 0,
    ...overrides,
  };
}

describe('Sorting utilities', () => {
  describe('sortGames', () => {
    it('should separate unplayed, someday maybe, and completed games', () => {
      const games = [
        createMockGame({ id: '1', isCompleted: false }),
        createMockGame({ id: '2', isCompleted: true }),
        createMockGame({ id: '3', isCompleted: false }),
        createMockGame({ id: '4', isCompleted: false, isSomedayMaybe: true }),
      ];

      const result = sortGames(games);

      expect(result.unplayed).toHaveLength(2);
      expect(result.somedayMaybe).toHaveLength(1);
      expect(result.completed).toHaveLength(1);
    });

    it('should sort unplayed by sortOrder ascending', () => {
      const games = [
        createMockGame({ id: '1', sortOrder: 2, isCompleted: false }),
        createMockGame({ id: '2', sortOrder: 0, isCompleted: false }),
        createMockGame({ id: '3', sortOrder: 1, isCompleted: false }),
      ];

      const result = sortGames(games);

      expect(result.unplayed[0].id).toBe('2');
      expect(result.unplayed[1].id).toBe('3');
      expect(result.unplayed[2].id).toBe('1');
    });

    it('should sort completed by completedDate descending', () => {
      const games = [
        createMockGame({
          id: '1',
          isCompleted: true,
          completedDate: '2024-01-01T00:00:00Z',
        }),
        createMockGame({
          id: '2',
          isCompleted: true,
          completedDate: '2024-03-01T00:00:00Z',
        }),
        createMockGame({
          id: '3',
          isCompleted: true,
          completedDate: '2024-02-01T00:00:00Z',
        }),
      ];

      const result = sortGames(games);

      expect(result.completed[0].id).toBe('2'); // Most recent
      expect(result.completed[1].id).toBe('3');
      expect(result.completed[2].id).toBe('1'); // Oldest
    });

    it('should handle empty arrays', () => {
      const result = sortGames([]);

      expect(result.unplayed).toHaveLength(0);
      expect(result.somedayMaybe).toHaveLength(0);
      expect(result.completed).toHaveLength(0);
    });

    it('should sort someday maybe by sortOrder ascending', () => {
      const games = [
        createMockGame({ id: '1', sortOrder: 2, isCompleted: false, isSomedayMaybe: true }),
        createMockGame({ id: '2', sortOrder: 0, isCompleted: false, isSomedayMaybe: true }),
        createMockGame({ id: '3', sortOrder: 1, isCompleted: false, isSomedayMaybe: true }),
      ];

      const result = sortGames(games);

      expect(result.somedayMaybe[0].id).toBe('2');
      expect(result.somedayMaybe[1].id).toBe('3');
      expect(result.somedayMaybe[2].id).toBe('1');
    });

    it('should not include someday maybe games in unplayed', () => {
      const games = [
        createMockGame({ id: '1', isCompleted: false }),
        createMockGame({ id: '2', isCompleted: false, isSomedayMaybe: true }),
      ];

      const result = sortGames(games);

      expect(result.unplayed).toHaveLength(1);
      expect(result.unplayed[0].id).toBe('1');
      expect(result.somedayMaybe).toHaveLength(1);
      expect(result.somedayMaybe[0].id).toBe('2');
    });

    it('should handle games without completedDate', () => {
      const games = [
        createMockGame({
          id: '1',
          isCompleted: true,
          completedDate: undefined,
        }),
        createMockGame({
          id: '2',
          isCompleted: true,
          completedDate: '2024-01-01T00:00:00Z',
        }),
      ];

      const result = sortGames(games);

      // Game with date should come first (more recent than epoch 0)
      expect(result.completed[0].id).toBe('2');
      expect(result.completed[1].id).toBe('1');
    });
  });

  describe('getNextSortOrder', () => {
    it('should return 0 for empty array', () => {
      expect(getNextSortOrder([])).toBe(0);
    });

    it('should return 0 when all games are completed', () => {
      const games = [
        createMockGame({ isCompleted: true, sortOrder: 5 }),
        createMockGame({ isCompleted: true, sortOrder: 3 }),
      ];

      expect(getNextSortOrder(games)).toBe(0);
    });

    it('should return max sortOrder + 1', () => {
      const games = [
        createMockGame({ id: '1', sortOrder: 2, isCompleted: false }),
        createMockGame({ id: '2', sortOrder: 5, isCompleted: false }),
        createMockGame({ id: '3', sortOrder: 1, isCompleted: false }),
      ];

      expect(getNextSortOrder(games)).toBe(6);
    });

    it('should ignore completed games', () => {
      const games = [
        createMockGame({ id: '1', sortOrder: 2, isCompleted: false }),
        createMockGame({ id: '2', sortOrder: 10, isCompleted: true }),
      ];

      expect(getNextSortOrder(games)).toBe(3);
    });
  });

  describe('reorderGamesList', () => {
    it('should update sortOrder based on new order', () => {
      const games = [
        createMockGame({ id: '1', sortOrder: 0 }),
        createMockGame({ id: '2', sortOrder: 1 }),
        createMockGame({ id: '3', sortOrder: 2 }),
      ];

      const result = reorderGamesList(games, ['3', '1', '2']);

      const game1 = result.find((g) => g.id === '1');
      const game2 = result.find((g) => g.id === '2');
      const game3 = result.find((g) => g.id === '3');

      expect(game3?.sortOrder).toBe(0);
      expect(game1?.sortOrder).toBe(1);
      expect(game2?.sortOrder).toBe(2);
    });

    it('should preserve games not in new order', () => {
      const games = [
        createMockGame({ id: '1', sortOrder: 0 }),
        createMockGame({ id: '2', sortOrder: 1 }),
        createMockGame({ id: '3', sortOrder: 2 }),
      ];

      // Only reorder 1 and 2
      const result = reorderGamesList(games, ['2', '1']);

      const game1 = result.find((g) => g.id === '1');
      const game2 = result.find((g) => g.id === '2');
      const game3 = result.find((g) => g.id === '3');

      expect(game2?.sortOrder).toBe(0);
      expect(game1?.sortOrder).toBe(1);
      expect(game3?.sortOrder).toBe(2); // Unchanged
    });
  });

  describe('hasUnplayedGames', () => {
    it('should return true if there are unplayed games', () => {
      const games = [
        createMockGame({ isCompleted: false }),
        createMockGame({ isCompleted: true }),
      ];

      expect(hasUnplayedGames(games)).toBe(true);
    });

    it('should return false if all games are completed', () => {
      const games = [
        createMockGame({ isCompleted: true }),
        createMockGame({ isCompleted: true }),
      ];

      expect(hasUnplayedGames(games)).toBe(false);
    });

    it('should return false for empty array', () => {
      expect(hasUnplayedGames([])).toBe(false);
    });
  });

  describe('hasCompletedGames', () => {
    it('should return true if there are completed games', () => {
      const games = [
        createMockGame({ isCompleted: false }),
        createMockGame({ isCompleted: true }),
      ];

      expect(hasCompletedGames(games)).toBe(true);
    });

    it('should return false if no games are completed', () => {
      const games = [
        createMockGame({ isCompleted: false }),
        createMockGame({ isCompleted: false }),
      ];

      expect(hasCompletedGames(games)).toBe(false);
    });

    it('should return false for empty array', () => {
      expect(hasCompletedGames([])).toBe(false);
    });
  });
});
