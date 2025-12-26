/**
 * Mock axios for API testing
 */

const mockAxiosInstance = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
};

const axios = {
  create: jest.fn(() => mockAxiosInstance),
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
  isAxiosError: jest.fn(),
  defaults: {
    headers: {
      common: {},
    },
  },
};

export default axios;
