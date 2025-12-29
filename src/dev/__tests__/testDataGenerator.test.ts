/**
 * Test Data Generator tests
 */

import {
  generateMockGame,
  generateTestGames,
} from '../testDataGenerator';

describe('Test Data Generator', () => {
  describe('generateMockGame', () => {
    it('should generate a valid game object', () => {
      const game = generateMockGame(0, false);

      expect(game).toMatchObject({
        id: expect.any(String),
        rawgId: expect.any(Number),
        name: expect.any(String),
        platform: expect.any(String),
        platformId: expect.any(Number),
        boxArtUrl: expect.any(String),
        isCompleted: false,
        sortOrder: 0,
        dateAdded: expect.any(String),
        colorIndex: 0,
      });
    });

    it('should generate a completed game with completedDate', () => {
      const game = generateMockGame(1, true);

      expect(game.isCompleted).toBe(true);
      expect(game.completedDate).toBeDefined();
      expect(game.playtimeHours).toBeGreaterThanOrEqual(5);
    });

    it('should cycle color index based on game index', () => {
      const game0 = generateMockGame(0, false);
      const game7 = generateMockGame(7, false);

      expect(game0.colorIndex).toBe(0);
      expect(game7.colorIndex).toBe(0); // Should cycle back to 0
    });

    it('should generate unique IDs', () => {
      const game1 = generateMockGame(0, false);
      const game2 = generateMockGame(0, false);

      expect(game1.id).not.toBe(game2.id);
    });
  });

  describe('generateTestGames', () => {
    it('should generate the specified number of games', () => {
      const games = generateTestGames(10);
      expect(games).toHaveLength(10);
    });

    it('should respect the completed ratio', () => {
      const games = generateTestGames(100, 0.3);
      const completedCount = games.filter((g) => g.isCompleted).length;

      // Should have approximately 30% completed (allow some variance)
      expect(completedCount).toBe(30);
    });

    it('should generate 0 games when count is 0', () => {
      const games = generateTestGames(0);
      expect(games).toHaveLength(0);
    });

    it('should handle 100% completed ratio', () => {
      const games = generateTestGames(10, 1.0);
      const completedCount = games.filter((g) => g.isCompleted).length;
      expect(completedCount).toBe(10);
    });

    it('should handle 0% completed ratio', () => {
      const games = generateTestGames(10, 0);
      const completedCount = games.filter((g) => g.isCompleted).length;
      expect(completedCount).toBe(0);
    });
  });
});
