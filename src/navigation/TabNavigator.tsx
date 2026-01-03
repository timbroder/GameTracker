/**
 * TabNavigator - Bottom tab navigation for the app
 */

import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen, SettingsScreen } from '../screens';
import { DiscoveryScreen } from '../screens/DiscoveryScreen';
import { useSupabaseSync } from '../hooks';
import type { RootTabParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();

/**
 * Tab bar icon component
 */
function TabIcon({
  name,
  focused,
}: {
  name: 'home' | 'discovery' | 'settings';
  focused: boolean;
}) {
  const icons = {
    home: '🎮',
    discovery: '🔍',
    settings: '⚙️',
  };

  return (
    <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>
      {icons[name]}
    </Text>
  );
}

/**
 * Background sync manager - handles auto-sync on launch and foreground
 * No UI, just triggers sync in the background
 */
function useSyncOnLaunchAndForeground() {
  useSupabaseSync({
    syncOnLaunch: true,
    syncOnForeground: true,
  });
}

/**
 * Main tab navigator
 */
export function TabNavigator() {
  // Handle background sync on launch and foreground
  useSyncOnLaunchAndForeground();

  return (
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
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            tabBarLabel: 'Settings',
            tabBarIcon: ({ focused }) => <TabIcon name="settings" focused={focused} />,
          }}
        />
      </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
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
