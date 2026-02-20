/**
 * Screenshot Share Service
 *
 * Captures a React Native view as PNG and opens the native share sheet.
 */

import { RefObject } from 'react';
import { captureRef } from 'react-native-view-shot';
import Share from 'react-native-share';
import RNFS from 'react-native-fs';

export async function captureAndShare(viewRef: RefObject<any>): Promise<void> {
  if (!viewRef.current) {
    return;
  }

  const uri = await captureRef(viewRef, {
    format: 'png',
    quality: 1,
  });

  try {
    await Share.open({
      url: uri,
      type: 'image/png',
    });
  } finally {
    try {
      await RNFS.unlink(uri.replace('file://', ''));
    } catch {
      // Ignore cleanup errors
    }
  }
}
