// Example test file demonstrating testing patterns

import { createMockGame, createMockGames, createMockCompletedGame } from './testHelpers';

describe('Test Helpers', () => {
  describe('createMockGame', () => {
    it('should create a mock game with default values', () => {
      const game = createMockGame();

      expect(game).toMatchObject({
        id: expect.any(String),
        rawgId: expect.any(Number),
        name: expect.any(String),
        platform: expect.any(String),
        platformId: expect.any(Number),
        boxArtUrl: expect.any(String),
        isCompleted: false,
        sortOrder: expect.any(Number),
        dateAdded: expect.any(String),
        colorIndex: expect.any(Number),
      });
    });

    it('should allow overriding default values', () => {
      const game = createMockGame({
        name: 'Custom Game',
        isCompleted: true,
      });

      expect(game.name).toBe('Custom Game');
      expect(game.isCompleted).toBe(true);
    });
  });

  describe('createMockGames', () => {
    it('should create multiple mock games', () => {
      const games = createMockGames(5);

      expect(games).toHaveLength(5);
      expect(games[0].id).toBe('test-game-1');
      expect(games[4].id).toBe('test-game-5');
    });

    it('should assign sequential sort orders', () => {
      const games = createMockGames(3);

      expect(games[0].sortOrder).toBe(0);
      expect(games[1].sortOrder).toBe(1);
      expect(games[2].sortOrder).toBe(2);
    });

    it('should cycle through color indices', () => {
      const games = createMockGames(10);

      expect(games[0].colorIndex).toBe(0);
      expect(games[6].colorIndex).toBe(6);
      expect(games[7].colorIndex).toBe(0); // Wraps around (7 % 7 = 0)
    });
  });

  describe('createMockCompletedGame', () => {
    it('should create a completed game', () => {
      const game = createMockCompletedGame();

      expect(game.isCompleted).toBe(true);
      expect(game.completedDate).toBeDefined();
    });

    it('should allow overriding completion date', () => {
      const customDate = '2025-01-01T00:00:00.000Z';
      const game = createMockCompletedGame({
        completedDate: customDate,
      });

      expect(game.completedDate).toBe(customDate);
    });
  });
});
