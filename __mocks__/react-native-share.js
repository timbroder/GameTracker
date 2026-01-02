/**
 * Mock for react-native-share
 */
module.exports = {
  default: {
    open: jest.fn().mockResolvedValue({ success: true }),
  },
};
