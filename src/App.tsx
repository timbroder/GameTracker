/**
 * GameTracker - Clear-style game tracking app
 */

import 'react-native-get-random-values'; // Must be first for uuid
import React, { useEffect, useState, useCallback } from 'react';
import { StatusBar, ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { HotUpdater } from '@hot-updater/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TabNavigator } from './navigation';
import { setApiKey } from './services/rawgApi';
import { runDuplicateMigration } from './services/migrateDuplicates';
import { runSomedayMaybeMigration } from './services/migrateSomedayMaybe';
import { runToPlayToSomedayMaybeMigration } from './services/migrateToPlayToSomedayMaybe';
import { ApiKeyScreen } from './screens/ApiKeyScreen';
import { STORAGE_KEYS } from './types/storage';
import { HOT_UPDATER_URL } from './config';

function App(): React.JSX.Element {
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);

  useEffect(() => {
    async function init() {
      // Check for stored RAWG API key
      const storedKey = await AsyncStorage.getItem(STORAGE_KEYS.RAWG_API_KEY);
      if (storedKey) {
        setApiKey(storedKey);
        setHasApiKey(true);
      } else {
        setHasApiKey(false);
      }

      // Run one-time migrations
      runDuplicateMigration().catch(() => {});
      runSomedayMaybeMigration().catch(() => {});
      runToPlayToSomedayMaybeMigration().catch(() => {});
    }

    init();
  }, []);

  const handleApiKeyComplete = useCallback(() => {
    setHasApiKey(true);
  }, []);

  // Loading state
  if (hasApiKey === null) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar barStyle="light-content" backgroundColor="#000" />
          <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator color="#4D96FF" size="large" />
          </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  // No API key — show onboarding
  if (!hasApiKey) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar barStyle="light-content" backgroundColor="#000" />
          <ApiKeyScreen onComplete={handleApiKeyComplete} />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

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
  baseURL: HOT_UPDATER_URL,
  updateStrategy: 'appVersion',
  updateMode: 'auto',
})(App);
