/**
 * GameTracker - Clear-style game tracking app
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
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
    <>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <HomeScreen />
    </>
  );
}

// Wrap with HotUpdater for OTA updates
export default HotUpdater.wrap({
  baseURL: 'https://juorsgyjsgablrgdqpyp.supabase.co/functions/v1/hot-updater',
  updateStrategy: 'appVersion',
  updateMode: 'auto',
})(App);
