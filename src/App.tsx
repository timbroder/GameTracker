/**
 * GameTracker - Clear-style game tracking app
 */

import React, { useEffect } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { HotUpdater } from '@hot-updater/react-native';
import TestScreen from './screens/TestScreen';
import { getRawgApiKey } from './config';
import { setApiKey } from './services/rawgApi';

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    // Initialize RAWG API key from config
    const apiKey = getRawgApiKey();
    if (apiKey) {
      setApiKey(apiKey);
    }
  }, []);

  return (
    <>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#000' : '#fff'}
      />
      <TestScreen />
    </>
  );
}

// Wrap with HotUpdater for OTA updates
export default HotUpdater.wrap({
  baseURL: 'https://juorsgyjsgablrgdqpyp.supabase.co/functions/v1/hot-updater',
  updateStrategy: 'appVersion',
  updateMode: 'auto',
})(App);
