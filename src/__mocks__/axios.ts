// Mock axios for API testing
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';

// Create a mock adapter instance
export const mockAxios = new MockAdapter(axios, { delayResponse: 0 });

// Reset all mocks between tests
export const resetAxiosMocks = () => {
  mockAxios.reset();
};

// Helper to mock successful responses
export const mockSuccessResponse = (url: string | RegExp, data: any) => {
  mockAxios.onGet(url).reply(200, data);
};

// Helper to mock error responses
export const mockErrorResponse = (url: string | RegExp, status: number = 500, message?: string) => {
  mockAxios.onGet(url).reply(status, { message: message || 'Network Error' });
};

export default mockAxios;
