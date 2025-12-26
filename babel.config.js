module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    'hot-updater/babel-plugin',
    'react-native-reanimated/plugin', // Must be last
  ],
};
