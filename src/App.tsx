/**
 * GameTracker - Clear-style game tracking app
 */

import 'react-native-get-random-values'; // Must be first for uuid
import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HotUpdater } from '@hot-updater/react-native';
import { HomeScreen } from './screens';
import { getRawgApiKey } from './config';
import { setApiKey } from './services/rawgApi';

function App(): React.JSX.Element {
  useEffect(() => {
    // Initialize RAWG API key from config
    const apiKey = getRawgApiKey();
    if (apiKey) {
      setApiKey(apiKey);
    }
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <HomeScreen />
    </SafeAreaProvider>
  );
}

// Wrap with HotUpdater for OTA updates
export default HotUpdater.wrap({
  baseURL: 'https://juorsgyjsgablrgdqpyp.supabase.co/functions/v1/hot-updater',
  updateStrategy: 'appVersion',
  updateMode: 'auto',
})(App);
