/**
 * RAWG API Service - Game search and details
 * API Documentation: https://api.rawg.io/docs/
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import type { GameSearchResult, GameDetails, Platform, GamesByPlatformResponse } from '../types';

const BASE_URL = 'https://api.rawg.io/api';
const DEFAULT_TIMEOUT = 10000;
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

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
    timeout: DEFAULT_TIMEOUT,
  });
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    // Retry on network errors or 5xx server errors
    if (!axiosError.response) {
      return true; // Network error
    }
    const status = axiosError.response.status;
    return status >= 500 || status === 429;
  }
  return false;
}

/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a function with retry logic and exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if it's not a retryable error
      if (!isRetryableError(error)) {
        throw error;
      }

      // Don't wait after the last attempt
      if (attempt < maxRetries) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
        console.log(`[RAWG API] Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
        await sleep(delay);
      }
    }
  }

  throw lastError;
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
        throw new Error('Invalid API key. Please check your RAWG API configuration.');
      } else if (status === 404) {
        throw new Error('Game not found');
      } else if (status === 429) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      } else if (status >= 500) {
        throw new Error('Game server is temporarily unavailable. Please try again.');
      }
      throw new Error(`Unable to load games (error ${status})`);
    } else if (axiosError.code === 'ECONNABORTED') {
      throw new Error('Request timed out. Please check your connection and try again.');
    } else if (axiosError.request) {
      throw new Error('No internet connection. Please check your network and try again.');
    }
  }
  throw new Error('Something went wrong. Please try again.');
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
    return await withRetry(async () => {
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
    });
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
    return await withRetry(async () => {
      const client = createClient();
      const response = await client.get<GameDetails>(`/games/${gameId}`);
      return response.data;
    });
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
    return await withRetry(async () => {
      const client = createClient();
      const response = await client.get<{ results: Platform[] }>('/platforms', {
        params: {
          page_size: pageSize,
        },
      });
      return response.data.results;
    });
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

/**
 * Get games for a specific platform, sorted alphabetically
 * Used for legacy game discovery feature
 * @param platformId - RAWG platform ID
 * @param page - Page number (1-indexed)
 * @param pageSize - Number of results per page (default 40, max 40)
 */
export async function getGamesByPlatform(
  platformId: number,
  page: number = 1,
  pageSize: number = 40,
): Promise<GamesByPlatformResponse> {
  try {
    return await withRetry(async () => {
      const client = createClient();
      const response = await client.get<GamesByPlatformResponse>('/games', {
        params: {
          platforms: platformId,
          ordering: 'name',
          page: page,
          page_size: Math.min(pageSize, 40),
        },
      });
      return response.data;
    });
  } catch (error) {
    handleApiError(error);
  }
}
