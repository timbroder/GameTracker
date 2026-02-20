/**
 * API Key Onboarding Screen
 *
 * First-time setup screen where users enter their RAWG API key.
 * Shown before the main app if no API key is stored.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../types/storage';
import { setApiKey } from '../services/rawgApi';

interface ApiKeyScreenProps {
  onComplete: () => void;
}

export function ApiKeyScreen({ onComplete }: ApiKeyScreenProps) {
  const insets = useSafeAreaInsets();
  const [apiKey, setApiKeyValue] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const trimmedKey = apiKey.trim();
    if (!trimmedKey) {
      setError('Please enter your API key');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      // Test the key with a simple RAWG API call
      const response = await fetch(
        `https://api.rawg.io/api/games?key=${trimmedKey}&page_size=1`,
      );

      if (response.status === 401) {
        setError('Invalid API key. Please check and try again.');
        return;
      }

      if (!response.ok) {
        setError('Could not validate key. Please check your connection.');
        return;
      }

      // Key is valid — save and proceed
      await AsyncStorage.setItem(STORAGE_KEYS.RAWG_API_KEY, trimmedKey);
      setApiKey(trimmedKey);
      onComplete();
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.emoji}>🎮</Text>
          <Text style={styles.title}>Welcome to GameTracker</Text>
          <Text style={styles.subtitle}>
            To search for games, you'll need a free API key from RAWG — the
            largest video game database.
          </Text>
        </View>

        <View style={styles.steps}>
          <Text style={styles.stepsTitle}>How to get your key:</Text>
          <Text style={styles.step}>1. Create a free account at rawg.io</Text>
          <Text style={styles.step}>2. Go to your API key page</Text>
          <Text style={styles.step}>3. Copy your key and paste it below</Text>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => Linking.openURL('https://rawg.io/apidocs')}
            activeOpacity={0.7}
          >
            <Text style={styles.linkButtonText}>Open RAWG API Page</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputSection}>
          <TextInput
            style={styles.input}
            placeholder="Paste your RAWG API key"
            placeholderTextColor="#666"
            value={apiKey}
            onChangeText={(text) => {
              setApiKeyValue(text);
              setError(null);
            }}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            style={[styles.submitButton, (!apiKey.trim() || isValidating) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!apiKey.trim() || isValidating}
            activeOpacity={0.7}
          >
            {isValidating ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Get Started</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          Your API key is stored locally on your device and never shared.
          RAWG's free tier allows 20,000 requests per month.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
  },
  steps: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    gap: 8,
  },
  stepsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  step: {
    fontSize: 15,
    color: '#CCC',
    lineHeight: 22,
  },
  linkButton: {
    backgroundColor: '#1a3a5c',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  linkButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4D96FF',
  },
  inputSection: {
    gap: 12,
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#FFF',
    borderWidth: 1,
    borderColor: '#333',
  },
  error: {
    fontSize: 14,
    color: '#FF6B6B',
  },
  submitButton: {
    backgroundColor: '#4D96FF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFF',
  },
  footer: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
});
