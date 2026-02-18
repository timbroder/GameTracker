/**
 * Game Manager service tests
 */

import {
  addGame,
  updateGame,
  deleteGame,
  toggleCompleted,
  reorderGames,
  getGames,
  getGame,
  gameExists,
  NewGameInput,
} from '../gameManager';
import * as storage from '../storage';
import type { Game } from '../../types/game';

// Mock storage service
jest.mock('../storage');
const mockStorage = storage as jest.Mocked<typeof storage>;

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-123'),
}));

describe('Game Manager Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock Date
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const mockGame: Game = {
    id: 'existing-id',
    rawgId: 12345,
    name: 'Test Game',
    platform: 'PlayStation 5',
    platformId: 187,
    boxArtUrl: 'https://example.com/boxart.jpg',
    isCompleted: false,
    sortOrder: 0,
    dateAdded: '2025-01-01T00:00:00.000Z',
    colorIndex: 0,
  };

  const newGameInput: NewGameInput = {
    rawgId: 67890,
    name: 'New Game',
    platform: 'Xbox Series X',
    platformId: 186,
    boxArtUrl: 'https://example.com/newgame.jpg',
  };

  describe('addGame', () => {
    it('should add a new game with generated fields', async () => {
      mockStorage.loadGames.mockResolvedValueOnce([mockGame]);
      mockStorage.saveGames.mockResolvedValueOnce(undefined);

      const result = await addGame(newGameInput);

      expect(result).toEqual({
        ...newGameInput,
        id: 'mock-uuid-123',
        dateAdded: '2025-01-15T12:00:00.000Z',
        sortOrder: 0, // New games go to top
        colorIndex: 1, // Next color after 0
        isCompleted: false,
      });

      // Existing game should have its sortOrder shifted up
      expect(mockStorage.saveGames).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ ...mockGame, sortOrder: 1 }), // Shifted
          expect.objectContaining(newGameInput),
        ]),
      );
    });

    it('should start with colorIndex 0 for first game', async () => {
      mockStorage.loadGames.mockResolvedValueOnce([]);
      mockStorage.saveGames.mockResolvedValueOnce(undefined);

      const result = await addGame(newGameInput);

      expect(result.colorIndex).toBe(0);
      expect(result.sortOrder).toBe(0);
    });

    it('should cycle colors after reaching max', async () => {
      const gamesWithMaxColor = [{ ...mockGame, colorIndex: 6 }];
      mockStorage.loadGames.mockResolvedValueOnce(gamesWithMaxColor);
      mockStorage.saveGames.mockResolvedValueOnce(undefined);

      const result = await addGame(newGameInput);

      expect(result.colorIndex).toBe(0); // Cycles back to 0
    });
  });

  describe('updateGame', () => {
    it('should update game properties', async () => {
      mockStorage.loadGames.mockResolvedValueOnce([mockGame]);
      mockStorage.saveGames.mockResolvedValueOnce(undefined);

      const result = await updateGame('existing-id', { playtimeHours: 10 });

      expect(result).toEqual({ ...mockGame, playtimeHours: 10 });
    });

    it('should throw error for non-existent game', async () => {
      mockStorage.loadGames.mockResolvedValueOnce([mockGame]);

      await expect(updateGame('non-existent', { name: 'New Name' })).rejects.toThrow(
        'Game with id non-existent not found',
      );
    });
  });

  describe('deleteGame', () => {
    it('should remove game from list', async () => {
      mockStorage.loadGames.mockResolvedValueOnce([mockGame]);
      mockStorage.saveGames.mockResolvedValueOnce(undefined);

      await deleteGame('existing-id');

      expect(mockStorage.saveGames).toHaveBeenCalledWith([]);
    });

    it('should throw error for non-existent game', async () => {
      mockStorage.loadGames.mockResolvedValueOnce([mockGame]);

      await expect(deleteGame('non-existent')).rejects.toThrow(
        'Game with id non-existent not found',
      );
    });
  });

  describe('toggleCompleted', () => {
    it('should mark game as completed with date and clear someday maybe', async () => {
      mockStorage.loadGames.mockResolvedValueOnce([mockGame]);
      mockStorage.saveGames.mockResolvedValueOnce(undefined);

      const result = await toggleCompleted('existing-id');

      expect(result.isCompleted).toBe(true);
      expect(result.completedDate).toBe('2025-01-15T12:00:00.000Z');
      expect(result.isSomedayMaybe).toBe(false);
    });

    it('should mark game as unplayed with someday maybe and clear date', async () => {
      const completedGame = {
        ...mockGame,
        isCompleted: true,
        completedDate: '2025-01-10T00:00:00.000Z',
      };
      mockStorage.loadGames.mockResolvedValueOnce([completedGame]);
      mockStorage.saveGames.mockResolvedValueOnce(undefined);

      const result = await toggleCompleted('existing-id');

      expect(result.isCompleted).toBe(false);
      expect(result.completedDate).toBeUndefined();
      expect(result.isSomedayMaybe).toBe(true);
    });

    it('should throw error for non-existent game', async () => {
      mockStorage.loadGames.mockResolvedValueOnce([]);

      await expect(toggleCompleted('non-existent')).rejects.toThrow(
        'Game with id non-existent not found',
      );
    });
  });

  describe('reorderGames', () => {
    it('should update sort orders based on new positions', async () => {
      const game1 = { ...mockGame, id: 'game-1', sortOrder: 0 };
      const game2 = { ...mockGame, id: 'game-2', sortOrder: 1 };
      const game3 = { ...mockGame, id: 'game-3', sortOrder: 2 };

      mockStorage.loadGames.mockResolvedValueOnce([game1, game2, game3]);
      mockStorage.saveGames.mockResolvedValueOnce(undefined);

      await reorderGames(['game-3', 'game-1', 'game-2']);

      expect(mockStorage.saveGames).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 'game-3', sortOrder: 0 }),
          expect.objectContaining({ id: 'game-1', sortOrder: 1 }),
          expect.objectContaining({ id: 'game-2', sortOrder: 2 }),
        ]),
      );
    });

    it('should not reorder completed games', async () => {
      const completedGame = { ...mockGame, id: 'completed', isCompleted: true, sortOrder: 0 };
      mockStorage.loadGames.mockResolvedValueOnce([completedGame]);
      mockStorage.saveGames.mockResolvedValueOnce(undefined);

      await reorderGames(['completed']);

      // Sort order should remain unchanged for completed games
      expect(mockStorage.saveGames).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 'completed', sortOrder: 0 }),
        ]),
      );
    });
  });

  describe('getGames', () => {
    it('should return all games', async () => {
      mockStorage.loadGames.mockResolvedValueOnce([mockGame]);

      const result = await getGames();

      expect(result).toEqual([mockGame]);
    });

    it('should filter by completed status', async () => {
      const completedGame = { ...mockGame, id: 'completed', isCompleted: true };
      mockStorage.loadGames.mockResolvedValueOnce([mockGame, completedGame]);

      const unplayed = await getGames({ completed: false });
      expect(unplayed).toEqual([mockGame]);

      mockStorage.loadGames.mockResolvedValueOnce([mockGame, completedGame]);
      const completed = await getGames({ completed: true });
      expect(completed).toEqual([completedGame]);
    });
  });

  describe('getGame', () => {
    it('should return game by id', async () => {
      mockStorage.loadGames.mockResolvedValueOnce([mockGame]);

      const result = await getGame('existing-id');

      expect(result).toEqual(mockGame);
    });

    it('should return null for non-existent game', async () => {
      mockStorage.loadGames.mockResolvedValueOnce([mockGame]);

      const result = await getGame('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('gameExists', () => {
    it('should return true if game exists', async () => {
      mockStorage.loadGames.mockResolvedValueOnce([mockGame]);

      const result = await gameExists(12345, 187);

      expect(result).toBe(true);
    });

    it('should return false if game does not exist', async () => {
      mockStorage.loadGames.mockResolvedValueOnce([mockGame]);

      const result = await gameExists(99999, 187);

      expect(result).toBe(false);
    });

    it('should differentiate by platform', async () => {
      mockStorage.loadGames.mockResolvedValueOnce([mockGame]);

      const result = await gameExists(12345, 999); // Same RAWG ID, different platform

      expect(result).toBe(false);
    });

    it('should return false for empty game list', async () => {
      mockStorage.loadGames.mockResolvedValueOnce([]);

      const result = await gameExists(12345, 187);

      expect(result).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should assign sortOrder at end when marking completed game as unplayed', async () => {
      const unplayedGame = { ...mockGame, id: 'unplayed', sortOrder: 0 };
      const completedGame = {
        ...mockGame,
        id: 'completed',
        isCompleted: true,
        completedDate: '2025-01-10T00:00:00.000Z',
        sortOrder: 5, // Old sort order from when it was unplayed
      };
      mockStorage.loadGames.mockResolvedValueOnce([unplayedGame, completedGame]);
      mockStorage.saveGames.mockResolvedValueOnce(undefined);

      const result = await toggleCompleted('completed');

      // Should get sortOrder 1 (next after unplayedGame's 0)
      expect(result.sortOrder).toBe(1);
    });

    it('should handle deleting the only game', async () => {
      mockStorage.loadGames.mockResolvedValueOnce([mockGame]);
      mockStorage.saveGames.mockResolvedValueOnce(undefined);

      await deleteGame('existing-id');

      expect(mockStorage.saveGames).toHaveBeenCalledWith([]);
    });

    it('should handle reordering with empty list', async () => {
      mockStorage.loadGames.mockResolvedValueOnce([]);
      mockStorage.saveGames.mockResolvedValueOnce(undefined);

      await reorderGames([]);

      expect(mockStorage.saveGames).toHaveBeenCalledWith([]);
    });

    it('should handle reordering with single game', async () => {
      mockStorage.loadGames.mockResolvedValueOnce([mockGame]);
      mockStorage.saveGames.mockResolvedValueOnce(undefined);

      await reorderGames(['existing-id']);

      expect(mockStorage.saveGames).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 'existing-id', sortOrder: 0 }),
        ]),
      );
    });
  });
});
