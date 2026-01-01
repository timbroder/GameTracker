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
 * Sync indicator overlay for tab bar area
 */
function SyncOverlay() {
  const insets = useSafeAreaInsets();
  const supabaseSync = useSupabaseSync({
    syncOnLaunch: true,
    syncOnForeground: true,
  });

  return (
    <View style={[styles.syncOverlay, { bottom: 60 + insets.bottom }]} pointerEvents="box-none">
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
      <SyncOverlay />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  syncOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
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
