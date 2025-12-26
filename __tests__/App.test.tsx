/**
 * @format
 */

import 'react-native';
import React from 'react';
import App from '../src/App';
import {HotUpdater} from '@hot-updater/react-native';

// Note: import explicitly to use the types shipped with jest.
import {it, expect, describe} from '@jest/globals';

// Note: test renderer must be required after react-native.
import renderer from 'react-test-renderer';

describe('App', () => {
  it('renders correctly', () => {
    renderer.create(<App />);
  });

  it('uses HotUpdater.wrap mock', () => {
    expect(HotUpdater.wrap).toHaveBeenCalled();
  });
});
