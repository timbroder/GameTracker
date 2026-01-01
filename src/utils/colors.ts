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

// =============================================================================
// Position-Based Color Gradients (Clear-style)
// =============================================================================

/**
 * Parse hex color to RGB components
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return { r: 0, g: 0, b: 0 };
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * Convert RGB to hex color
 */
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) =>
    Math.round(Math.max(0, Math.min(255, n)))
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * Interpolate between two hex colors
 * @param color1 - Start color (hex)
 * @param color2 - End color (hex)
 * @param factor - 0 = color1, 1 = color2
 */
export function interpolateColor(color1: string, color2: string, factor: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);

  const r = c1.r + (c2.r - c1.r) * factor;
  const g = c1.g + (c2.g - c1.g) * factor;
  const b = c1.b + (c2.b - c1.b) * factor;

  return rgbToHex(r, g, b);
}

/**
 * Green gradient range for "To Play" section
 * Dark forest green at top → Light mint green at bottom
 */
const GREEN_GRADIENT = {
  darkPrimary: '#1B5E20',    // Dark forest green
  darkSecondary: '#2E7D32',  // Slightly lighter dark green
  lightPrimary: '#81C784',   // Light green
  lightSecondary: '#A5D6A7', // Mint green
};

/**
 * Grey gradient range for "Completed" section
 * Dark charcoal at top → Light silver at bottom
 */
const GREY_GRADIENT = {
  darkPrimary: '#37474F',    // Dark blue-grey
  darkSecondary: '#455A64',  // Slightly lighter dark grey
  lightPrimary: '#90A4AE',   // Light blue-grey
  lightSecondary: '#B0BEC5', // Silver
};

/**
 * Get position-based green color for "To Play" items
 * @param index - Item's position in the list (0-based)
 * @param total - Total number of items in the list
 */
export function getPositionalGreen(index: number, total: number): GradientColor {
  // Avoid division by zero; single item gets darkest color
  const factor = total > 1 ? index / (total - 1) : 0;

  return {
    primary: interpolateColor(GREEN_GRADIENT.darkPrimary, GREEN_GRADIENT.lightPrimary, factor),
    secondary: interpolateColor(GREEN_GRADIENT.darkSecondary, GREEN_GRADIENT.lightSecondary, factor),
  };
}

/**
 * Get position-based grey color for "Completed" items
 * @param index - Item's position in the completed list (0-based)
 * @param total - Total number of completed items
 */
export function getPositionalGrey(index: number, total: number): GradientColor {
  // Avoid division by zero; single item gets darkest color
  const factor = total > 1 ? index / (total - 1) : 0;

  return {
    primary: interpolateColor(GREY_GRADIENT.darkPrimary, GREY_GRADIENT.lightPrimary, factor),
    secondary: interpolateColor(GREY_GRADIENT.darkSecondary, GREY_GRADIENT.lightSecondary, factor),
  };
}
