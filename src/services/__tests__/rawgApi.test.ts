/**
 * RAWG API service tests
 */

import axios from 'axios';
import {
  setApiKey,
  getApiKey,
  searchGames,
  getGameDetails,
  getPlatforms,
  getGamePlatforms,
} from '../rawgApi';

// Axios is automatically mocked via src/__mocks__/axios.ts
const mockAxios = axios as jest.Mocked<typeof axios>;

describe('RAWG API Service', () => {
  let mockGet: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    setApiKey('test-api-key');

    // Set up the mock get function that axios.create() returns
    mockGet = jest.fn();
    mockAxios.create.mockReturnValue({ get: mockGet } as any);
  });

  describe('API Key Management', () => {
    it('should set and get API key', () => {
      setApiKey('new-key');
      expect(getApiKey()).toBe('new-key');
    });
  });

  describe('searchGames', () => {
    it('should search for games', async () => {
      const mockResults = {
        results: [
          {
            id: 123,
            name: 'Test Game',
            background_image: 'https://example.com/image.jpg',
            platforms: [{ platform: { id: 1, name: 'PC', slug: 'pc' } }],
          },
        ],
      };

      mockGet.mockResolvedValue({ data: mockResults });

      const result = await searchGames('test');

      expect(result).toEqual(mockResults.results);
      expect(mockGet).toHaveBeenCalledWith('/games', {
        params: { search: 'test', page_size: 10 },
      });
    });

    it('should return empty array for empty query', async () => {
      const result = await searchGames('');
      expect(result).toEqual([]);
    });

    it('should return empty array for whitespace query', async () => {
      const result = await searchGames('   ');
      expect(result).toEqual([]);
    });

    it('should limit page size to 40', async () => {
      mockGet.mockResolvedValue({ data: { results: [] } });

      await searchGames('test', 100);

      expect(mockGet).toHaveBeenCalledWith('/games', {
        params: { search: 'test', page_size: 40 },
      });
    });

    it('should throw error for invalid API key', async () => {
      mockGet.mockRejectedValue({
        isAxiosError: true,
        response: { status: 401 },
      });
      mockAxios.isAxiosError.mockReturnValue(true);

      await expect(searchGames('test')).rejects.toThrow('Invalid API key');
    });

    it('should throw error for rate limit after retries', async () => {
      mockGet.mockRejectedValue({
        isAxiosError: true,
        response: { status: 429 },
      });
      mockAxios.isAxiosError.mockReturnValue(true);

      // Rate limit is retried, so this will take longer
      await expect(searchGames('test')).rejects.toThrow(
        'Too many requests',
      );
    }, 15000);

    it('should throw error for network issues after retries', async () => {
      mockGet.mockRejectedValue({
        isAxiosError: true,
        request: {},
        response: undefined,
      });
      mockAxios.isAxiosError.mockReturnValue(true);

      // Network errors are retried, so this will take longer
      await expect(searchGames('test')).rejects.toThrow(
        'No internet connection',
      );
    }, 15000);
  });

  describe('getGameDetails', () => {
    it('should fetch game details', async () => {
      const mockGame = {
        id: 123,
        name: 'Test Game',
        background_image: 'https://example.com/image.jpg',
        description_raw: 'A test game',
        platforms: [{ platform: { id: 1, name: 'PC', slug: 'pc' } }],
        genres: [{ id: 1, name: 'Action' }],
      };

      mockGet.mockResolvedValue({ data: mockGame });

      const result = await getGameDetails(123);

      expect(result).toEqual(mockGame);
      expect(mockGet).toHaveBeenCalledWith('/games/123');
    });

    it('should throw error for not found', async () => {
      mockGet.mockRejectedValue({
        isAxiosError: true,
        response: { status: 404 },
      });
      mockAxios.isAxiosError.mockReturnValue(true);

      await expect(getGameDetails(999)).rejects.toThrow('Game not found');
    });
  });

  describe('getPlatforms', () => {
    it('should fetch platforms list', async () => {
      const mockPlatforms = {
        results: [
          { id: 1, name: 'PC', slug: 'pc' },
          { id: 2, name: 'PlayStation 5', slug: 'playstation5' },
        ],
      };

      mockGet.mockResolvedValue({ data: mockPlatforms });

      const result = await getPlatforms();

      expect(result).toEqual(mockPlatforms.results);
    });
  });

  describe('getGamePlatforms', () => {
    it('should fetch platforms for a specific game', async () => {
      const mockGame = {
        id: 123,
        name: 'Test Game',
        background_image: 'https://example.com/image.jpg',
        description_raw: 'A test game',
        platforms: [
          { platform: { id: 1, name: 'PC', slug: 'pc' } },
          { platform: { id: 2, name: 'PS5', slug: 'playstation5' } },
        ],
        genres: [],
      };

      mockGet.mockResolvedValue({ data: mockGame });

      const result = await getGamePlatforms(123);

      expect(result).toEqual([
        { id: 1, name: 'PC', slug: 'pc' },
        { id: 2, name: 'PS5', slug: 'playstation5' },
      ]);
    });
  });
});
