/**
 * Mock for @hot-updater/react-native
 * Provides a pass-through wrapper for testing without OTA functionality
 */

const HotUpdater = {
  wrap: jest.fn((options) => (Component) => Component),
};

module.exports = {
  HotUpdater,
};
