/**
 * TabNavigator - Bottom tab navigation for the app
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeScreen } from '../screens';
import { DiscoveryScreen } from '../screens/DiscoveryScreen';
import { SyncIndicator } from '../components';
import { useSupabaseSync } from '../hooks';
import { APP_VERSION } from '../config';
import type { RootTabParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();

/**
 * Tab bar icon component
 */
function TabIcon({ name, focused }: { name: 'home' | 'discovery'; focused: boolean }) {
  const icons = {
    home: focused ? '🎮' : '🎮',
    discovery: focused ? '🔍' : '🔍',
  };

  return (
    <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>
      {icons[name]}
    </Text>
  );
}

/**
 * Shared header with sync indicator
 */
function SharedHeader() {
  const insets = useSafeAreaInsets();
  const supabaseSync = useSupabaseSync({
    syncOnLaunch: true,
    syncOnForeground: true,
  });

  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <Text style={styles.versionText}>v{APP_VERSION}</Text>
      <SyncIndicator
        isAvailable={supabaseSync.isAvailable}
        isSyncing={supabaseSync.isSyncing}
        lastSyncTime={supabaseSync.lastSyncTime}
        lastSyncSuccess={supabaseSync.lastSyncSuccess}
        lastSyncMessage={supabaseSync.lastSyncMessage}
        availabilityMessage={supabaseSync.availabilityMessage}
        sync={supabaseSync.sync}
      />
    </View>
  );
}

/**
 * Main tab navigator
 */
export function TabNavigator() {
  return (
    <View style={styles.container}>
      <SharedHeader />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: '#4D96FF',
          tabBarInactiveTintColor: '#666',
          tabBarLabelStyle: styles.tabLabel,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarLabel: 'My Games',
            tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Discovery"
          component={DiscoveryScreen}
          options={{
            tabBarLabel: 'Discovery',
            tabBarIcon: ({ focused }) => <TabIcon name="discovery" focused={focused} />,
          }}
        />
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#000',
  },
  versionText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
  },
  tabBar: {
    backgroundColor: '#111',
    borderTopColor: '#222',
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  tabIcon: {
    fontSize: 20,
    opacity: 0.6,
  },
  tabIconFocused: {
    opacity: 1,
  },
});

export default TabNavigator;
