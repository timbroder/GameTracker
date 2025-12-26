/**
 * RAWG API Service - Game search and details
 * API Documentation: https://api.rawg.io/docs/
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import type { GameSearchResult, GameDetails, Platform } from '../types/game';

const BASE_URL = 'https://api.rawg.io/api';

// API key should be set via setApiKey() before making requests
let apiKey: string | null = null;

/**
 * Set the RAWG API key
 * Call this on app initialization with the key from your config
 */
export function setApiKey(key: string): void {
  apiKey = key;
}

/**
 * Get the configured API key
 */
export function getApiKey(): string | null {
  return apiKey;
}

/**
 * Create axios instance with base configuration
 */
function createClient(): AxiosInstance {
  if (!apiKey) {
    throw new Error(
      'RAWG API key not configured. Call setApiKey() before making requests.',
    );
  }

  return axios.create({
    baseURL: BASE_URL,
    params: {
      key: apiKey,
    },
    timeout: 10000,
  });
}

/**
 * Handle API errors consistently
 */
function handleApiError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    if (axiosError.response) {
      const status = axiosError.response.status;
      if (status === 401) {
        throw new Error('Invalid RAWG API key');
      } else if (status === 404) {
        throw new Error('Resource not found');
      } else if (status === 429) {
        throw new Error('API rate limit exceeded. Please try again later.');
      }
      throw new Error(`API error: ${status}`);
    } else if (axiosError.request) {
      throw new Error('Network error. Please check your connection.');
    }
  }
  throw new Error('An unexpected error occurred');
}

/**
 * Search for games by name
 * @param query - Search query string
 * @param pageSize - Number of results (default 10, max 40)
 */
export async function searchGames(
  query: string,
  pageSize: number = 10,
): Promise<GameSearchResult[]> {
  if (!query.trim()) {
    return [];
  }

  try {
    const client = createClient();
    const response = await client.get<{ results: GameSearchResult[] }>(
      '/games',
      {
        params: {
          search: query,
          page_size: Math.min(pageSize, 40),
        },
      },
    );
    return response.data.results;
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Get detailed information about a specific game
 * @param gameId - RAWG game ID
 */
export async function getGameDetails(gameId: number): Promise<GameDetails> {
  try {
    const client = createClient();
    const response = await client.get<GameDetails>(`/games/${gameId}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Get list of all platforms
 * @param pageSize - Number of results (default 50)
 */
export async function getPlatforms(pageSize: number = 50): Promise<Platform[]> {
  try {
    const client = createClient();
    const response = await client.get<{ results: Platform[] }>('/platforms', {
      params: {
        page_size: pageSize,
      },
    });
    return response.data.results;
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Get platforms for a specific game
 * Useful when a game supports multiple platforms
 * @param gameId - RAWG game ID
 */
export async function getGamePlatforms(gameId: number): Promise<Platform[]> {
  const details = await getGameDetails(gameId);
  return details.platforms.map((p) => p.platform);
}
