/**
 * GameTracker - Clear-style game tracking app
 */

import 'react-native-get-random-values'; // Must be first for uuid
import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { HotUpdater } from '@hot-updater/react-native';
import { TabNavigator } from './navigation';
import { getRawgApiKey } from './config';
import { setApiKey } from './services/rawgApi';
import { runDuplicateMigration } from './services/migrateDuplicates';
import { runSomedayMaybeMigration } from './services/migrateSomedayMaybe';

function App(): React.JSX.Element {
  useEffect(() => {
    // Initialize RAWG API key from config
    const apiKey = getRawgApiKey();
    if (apiKey) {
      setApiKey(apiKey);
    }

    // Run one-time migrations
    runDuplicateMigration().catch(console.error);
    runSomedayMaybeMigration().catch(console.error);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <NavigationContainer>
          <TabNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// Wrap with HotUpdater for OTA updates
export default HotUpdater.wrap({
  baseURL: 'https://juorsgyjsgablrgdqpyp.supabase.co/functions/v1/hot-updater',
  updateStrategy: 'appVersion',
  updateMode: 'auto',
})(App);
