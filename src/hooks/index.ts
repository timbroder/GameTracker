/**
 * Hooks barrel export
 */

export { useGames } from './useGames';
export type { UseGamesState, UseGamesActions, UseGamesReturn } from './useGames';

export { useHaptics } from './useHaptics';
export type { UseHapticsReturn } from './useHaptics';

export { useSupabaseSync } from './useSupabaseSync';
export type {
  SupabaseSyncState,
  SupabaseSyncActions,
  UseSupabaseSyncReturn,
} from './useSupabaseSync';

export { useSeenGames } from './useSeenGames';
export type {
  UseSeenGamesState,
  UseSeenGamesActions,
  UseSeenGamesReturn,
} from './useSeenGames';

export { useDiscovery } from './useDiscovery';
export type { UseDiscoveryReturn } from './useDiscovery';
