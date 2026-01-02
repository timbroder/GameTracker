/**
 * Mock for react-native-fs
 */
module.exports = {
  CachesDirectoryPath: '/mock/caches',
  writeFile: jest.fn().mockResolvedValue(undefined),
  unlink: jest.fn().mockResolvedValue(undefined),
};
