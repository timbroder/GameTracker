/**
 * Color utilities tests
 */

import {
  CLEAR_COLORS,
  COMPLETED_COLOR,
  getColorForIndex,
  getCompletedColor,
  getGameColor,
  getGradientProps,
  getNextColorIndex,
  COMPLETED_OPACITY,
} from '../colors';

describe('Color utilities', () => {
  describe('CLEAR_COLORS', () => {
    it('should have 7 colors', () => {
      expect(CLEAR_COLORS).toHaveLength(7);
    });

    it('should have valid color objects', () => {
      CLEAR_COLORS.forEach((color) => {
        expect(color).toHaveProperty('primary');
        expect(color).toHaveProperty('secondary');
        expect(color.primary).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(color.secondary).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });
  });

  describe('COMPLETED_COLOR', () => {
    it('should have valid grey colors', () => {
      expect(COMPLETED_COLOR.primary).toBe('#9CA3AF');
      expect(COMPLETED_COLOR.secondary).toBe('#B5BBC3');
    });
  });

  describe('getColorForIndex', () => {
    it('should return correct color for valid index', () => {
      expect(getColorForIndex(0)).toBe(CLEAR_COLORS[0]);
      expect(getColorForIndex(3)).toBe(CLEAR_COLORS[3]);
      expect(getColorForIndex(6)).toBe(CLEAR_COLORS[6]);
    });

    it('should wrap around for index >= 7', () => {
      expect(getColorForIndex(7)).toBe(CLEAR_COLORS[0]);
      expect(getColorForIndex(8)).toBe(CLEAR_COLORS[1]);
      expect(getColorForIndex(14)).toBe(CLEAR_COLORS[0]);
    });

    it('should handle negative indices', () => {
      expect(getColorForIndex(-1)).toBe(CLEAR_COLORS[1]);
      expect(getColorForIndex(-7)).toBe(CLEAR_COLORS[0]);
    });
  });

  describe('getCompletedColor', () => {
    it('should return COMPLETED_COLOR', () => {
      expect(getCompletedColor()).toBe(COMPLETED_COLOR);
    });
  });

  describe('getGameColor', () => {
    it('should return color for non-completed game', () => {
      expect(getGameColor(2, false)).toBe(CLEAR_COLORS[2]);
    });

    it('should return completed color for completed game', () => {
      expect(getGameColor(2, true)).toBe(COMPLETED_COLOR);
    });

    it('should ignore colorIndex when completed', () => {
      expect(getGameColor(0, true)).toBe(COMPLETED_COLOR);
      expect(getGameColor(5, true)).toBe(COMPLETED_COLOR);
    });
  });

  describe('getGradientProps', () => {
    it('should return gradient props with colors', () => {
      const color = CLEAR_COLORS[0];
      const props = getGradientProps(color);

      expect(props.colors).toHaveLength(2);
      expect(props.colors[0]).toBe(color.primary);
      expect(props.colors[1]).toBe(color.secondary);
    });

    it('should return start and end points for vertical gradient', () => {
      const props = getGradientProps(CLEAR_COLORS[0]);

      expect(props.start).toEqual({ x: 0, y: 0 });
      expect(props.end).toEqual({ x: 0, y: 1 }); // Vertical gradient for row banding
    });

    it('should apply opacity when less than 1', () => {
      const color = { primary: '#FF0000', secondary: '#00FF00' };
      const props = getGradientProps(color, 0.5);

      // 0.5 * 255 = 127.5 -> 128 -> 0x80
      expect(props.colors[0]).toBe('#FF000080');
      expect(props.colors[1]).toBe('#00FF0080');
    });

    it('should not modify colors when opacity is 1', () => {
      const color = CLEAR_COLORS[0];
      const props = getGradientProps(color, 1);

      expect(props.colors[0]).toBe(color.primary);
      expect(props.colors[1]).toBe(color.secondary);
    });
  });

  describe('COMPLETED_OPACITY', () => {
    it('should be 0.6', () => {
      expect(COMPLETED_OPACITY).toBe(0.6);
    });
  });

  describe('getNextColorIndex', () => {
    it('should return next index', () => {
      expect(getNextColorIndex(0)).toBe(1);
      expect(getNextColorIndex(3)).toBe(4);
      expect(getNextColorIndex(5)).toBe(6);
    });

    it('should wrap around at 7', () => {
      expect(getNextColorIndex(6)).toBe(0);
    });
  });
});
