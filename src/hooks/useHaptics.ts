/**
 * useHaptics - Haptic feedback hook
 *
 * Provides easy access to haptic feedback for gestures and interactions.
 * Uses react-native-haptic-feedback for iOS-specific haptics.
 */

import { useCallback } from 'react';
import ReactNativeHapticFeedback, {
  HapticFeedbackTypes,
} from 'react-native-haptic-feedback';

const hapticOptions = {
  enableVibrateFallback: false, // Don't use vibration on devices without haptics
  ignoreAndroidSystemSettings: false,
};

export interface UseHapticsReturn {
  /** Light impact - for subtle feedback (selections, toggles) */
  light: () => void;
  /** Medium impact - for significant actions (confirming, triggering) */
  medium: () => void;
  /** Heavy impact - for important feedback (errors, warnings, deletions) */
  heavy: () => void;
  /** Selection feedback - for picker-style selections */
  selection: () => void;
  /** Success notification - for successful actions */
  success: () => void;
  /** Warning notification - for warnings */
  warning: () => void;
  /** Error notification - for errors */
  error: () => void;
}

/**
 * Hook for haptic feedback
 */
export function useHaptics(): UseHapticsReturn {
  const trigger = useCallback((type: HapticFeedbackTypes) => {
    ReactNativeHapticFeedback.trigger(type, hapticOptions);
  }, []);

  const light = useCallback(() => {
    trigger(HapticFeedbackTypes.impactLight);
  }, [trigger]);

  const medium = useCallback(() => {
    trigger(HapticFeedbackTypes.impactMedium);
  }, [trigger]);

  const heavy = useCallback(() => {
    trigger(HapticFeedbackTypes.impactHeavy);
  }, [trigger]);

  const selection = useCallback(() => {
    trigger(HapticFeedbackTypes.selection);
  }, [trigger]);

  const success = useCallback(() => {
    trigger(HapticFeedbackTypes.notificationSuccess);
  }, [trigger]);

  const warning = useCallback(() => {
    trigger(HapticFeedbackTypes.notificationWarning);
  }, [trigger]);

  const error = useCallback(() => {
    trigger(HapticFeedbackTypes.notificationError);
  }, [trigger]);

  return {
    light,
    medium,
    heavy,
    selection,
    success,
    warning,
    error,
  };
}

export default useHaptics;
