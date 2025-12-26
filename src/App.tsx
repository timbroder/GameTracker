/**
 * GameTracker - Clear-style game tracking app
 */

import 'react-native-get-random-values'; // Must be first for uuid
import React, { useEffect, useState } from 'react';
import { StatusBar, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { HotUpdater } from '@hot-updater/react-native';
import { HomeScreen, TestScreen } from './screens';
import { getRawgApiKey } from './config';
import { setApiKey } from './services/rawgApi';

function App(): React.JSX.Element {
  const [showTestScreen, setShowTestScreen] = useState(false);

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
      {showTestScreen ? <TestScreen /> : <HomeScreen />}
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setShowTestScreen(!showTestScreen)}
      >
        <Text style={styles.toggleButtonText}>
          {showTestScreen ? '🏠' : '➕'}
        </Text>
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  toggleButton: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4D96FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  toggleButtonText: {
    fontSize: 24,
  },
});

// Wrap with HotUpdater for OTA updates
export default HotUpdater.wrap({
  baseURL: 'https://juorsgyjsgablrgdqpyp.supabase.co/functions/v1/hot-updater',
  updateStrategy: 'appVersion',
  updateMode: 'auto',
})(App);
