/**
 * Clear-style color palette and utilities
 */

export interface GradientColor {
  primary: string;
  secondary: string;
}

/**
 * Clear-inspired color palette (7 vibrant colors)
 * Colors cycle through this array based on colorIndex
 */
export const CLEAR_COLORS: GradientColor[] = [
  { primary: '#FF6B6B', secondary: '#FF8E8E' }, // Red
  { primary: '#FFA94D', secondary: '#FFB366' }, // Orange
  { primary: '#FFD93D', secondary: '#FFE066' }, // Yellow
  { primary: '#6BCF7F', secondary: '#8FD99E' }, // Green
  { primary: '#4ECDC4', secondary: '#6DD5CD' }, // Teal
  { primary: '#4D96FF', secondary: '#6BA8FF' }, // Blue
  { primary: '#9D4EDD', secondary: '#B26FE8' }, // Purple
];

/**
 * Grey color for completed games
 */
export const COMPLETED_COLOR: GradientColor = {
  primary: '#9CA3AF',
  secondary: '#B5BBC3',
};

/**
 * Get color for a game based on its colorIndex
 * Wraps around if index exceeds palette size
 */
export function getColorForIndex(colorIndex: number): GradientColor {
  const index = Math.abs(colorIndex) % CLEAR_COLORS.length;
  return CLEAR_COLORS[index];
}

/**
 * Get the completed (grey) color
 */
export function getCompletedColor(): GradientColor {
  return COMPLETED_COLOR;
}

/**
 * Get the appropriate color for a game based on its state
 */
export function getGameColor(colorIndex: number, isCompleted: boolean): GradientColor {
  return isCompleted ? getCompletedColor() : getColorForIndex(colorIndex);
}

/**
 * Get gradient props for react-native-linear-gradient
 * Returns start/end points and colors array
 */
export function getGradientProps(color: GradientColor, opacity: number = 1) {
  const applyOpacity = (hex: string, op: number): string => {
    if (op >= 1) return hex;
    // Convert opacity to hex (0-255)
    const alpha = Math.round(op * 255)
      .toString(16)
      .padStart(2, '0');
    return `${hex}${alpha}`;
  };

  return {
    colors: [
      applyOpacity(color.primary, opacity),
      applyOpacity(color.secondary, opacity),
    ],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0.25 }, // 15° angle approximation
  };
}

/**
 * Opacity for completed games
 */
export const COMPLETED_OPACITY = 0.6;

/**
 * Get the next color index (cycles through palette)
 */
export function getNextColorIndex(currentIndex: number): number {
  return (currentIndex + 1) % CLEAR_COLORS.length;
}
