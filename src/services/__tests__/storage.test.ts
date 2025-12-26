/**
 * Storage service tests
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  saveGames,
  loadGames,
  savePreferences,
  loadPreferences,
  clearAllData,
} from '../storage';
import { STORAGE_KEYS, DEFAULT_PREFERENCES } from '../../types/storage';
import type { Game } from '../../types/game';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  multiRemove: jest.fn(),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('Storage Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockGame: Game = {
    id: 'test-id-123',
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

  describe('saveGames', () => {
    it('should save games to AsyncStorage', async () => {
      const games = [mockGame];
      mockAsyncStorage.setItem.mockResolvedValueOnce(undefined);

      await saveGames(games);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.GAMES,
        JSON.stringify(games),
      );
    });

    it('should throw error on save failure', async () => {
      mockAsyncStorage.setItem.mockRejectedValueOnce(new Error('Storage full'));

      await expect(saveGames([mockGame])).rejects.toThrow('Failed to save games');
    });
  });

  describe('loadGames', () => {
    it('should load games from AsyncStorage', async () => {
      const games = [mockGame];
      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(games));

      const result = await loadGames();

      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith(STORAGE_KEYS.GAMES);
      expect(result).toEqual(games);
    });

    it('should return empty array when no games stored', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);

      const result = await loadGames();

      expect(result).toEqual([]);
    });

    it('should throw error on load failure', async () => {
      mockAsyncStorage.getItem.mockRejectedValueOnce(new Error('Read error'));

      await expect(loadGames()).rejects.toThrow('Failed to load games');
    });
  });

  describe('savePreferences', () => {
    it('should save preferences to AsyncStorage', async () => {
      const prefs = { ...DEFAULT_PREFERENCES, hapticFeedbackEnabled: false };
      mockAsyncStorage.setItem.mockResolvedValueOnce(undefined);

      await savePreferences(prefs);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.USER_PREFS,
        JSON.stringify(prefs),
      );
    });
  });

  describe('loadPreferences', () => {
    it('should load preferences from AsyncStorage', async () => {
      const prefs = { ...DEFAULT_PREFERENCES, colorScheme: 'pastel' as const };
      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(prefs));

      const result = await loadPreferences();

      expect(result).toEqual(prefs);
    });

    it('should return defaults when no preferences stored', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);

      const result = await loadPreferences();

      expect(result).toEqual(DEFAULT_PREFERENCES);
    });

    it('should merge with defaults for partial preferences', async () => {
      const partialPrefs = { colorScheme: 'pastel' };
      mockAsyncStorage.getItem.mockResolvedValueOnce(
        JSON.stringify(partialPrefs),
      );

      const result = await loadPreferences();

      expect(result).toEqual({
        ...DEFAULT_PREFERENCES,
        colorScheme: 'pastel',
      });
    });

    it('should return defaults on error', async () => {
      mockAsyncStorage.getItem.mockRejectedValueOnce(new Error('Read error'));

      const result = await loadPreferences();

      expect(result).toEqual(DEFAULT_PREFERENCES);
    });
  });

  describe('clearAllData', () => {
    it('should remove all storage keys', async () => {
      mockAsyncStorage.multiRemove.mockResolvedValueOnce(undefined);

      await clearAllData();

      expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith(
        Object.values(STORAGE_KEYS),
      );
    });
  });
});
