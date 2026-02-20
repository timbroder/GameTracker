/**
 * useScreenshotDetector - Detects iOS screenshots via native module
 */

import { useEffect } from 'react';
import { NativeModules, NativeEventEmitter } from 'react-native';

const { ScreenshotDetector } = NativeModules;

export function useScreenshotDetector(onScreenshot: () => void) {
  useEffect(() => {
    if (!ScreenshotDetector) {
      return;
    }

    const emitter = new NativeEventEmitter(ScreenshotDetector);
    const subscription = emitter.addListener('onScreenshot', onScreenshot);

    return () => {
      subscription.remove();
    };
  }, [onScreenshot]);
}
