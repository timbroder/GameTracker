/**
 * @format
 */

import 'react-native';
import React from 'react';

// Mock the gameManager before importing App
jest.mock('../src/services/gameManager', () => ({
  getGames: () => Promise.resolve([]),
  addGame: () => Promise.resolve({}),
  deleteGame: () => Promise.resolve(),
}));

import App from '../src/App';
import {HotUpdater} from '@hot-updater/react-native';

// Note: import explicitly to use the types shipped with jest.
import {it, expect, describe, afterEach} from '@jest/globals';

// Note: test renderer must be required after react-native.
import renderer, {act} from 'react-test-renderer';

describe('App', () => {
  let component: renderer.ReactTestRenderer;

  afterEach(async () => {
    // Properly unmount to prevent async state updates
    await act(async () => {
      component?.unmount();
    });
  });

  it('renders correctly', async () => {
    await act(async () => {
      component = renderer.create(<App />);
    });
  });

  it('uses HotUpdater.wrap mock', () => {
    expect(HotUpdater.wrap).toHaveBeenCalled();
  });
});
