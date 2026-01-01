/**
 * Navigation type definitions
 */

import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

/**
 * Root tab navigator param list
 */
export type RootTabParamList = {
  Home: undefined;
  Discovery: undefined;
};

/**
 * Props for screens in the tab navigator
 */
export type HomeScreenProps = BottomTabScreenProps<RootTabParamList, 'Home'>;
export type DiscoveryScreenProps = BottomTabScreenProps<RootTabParamList, 'Discovery'>;
