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
 * Uses vertical gradient (top to bottom) for Clear-style row banding
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
      applyOpacity(color.primary, opacity),   // Top of row (darker)
      applyOpacity(color.secondary, opacity), // Bottom of row (lighter)
    ],
    start: { x: 0, y: 0 },  // Top
    end: { x: 0, y: 1 },    // Bottom - vertical gradient for banding effect
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
 * Dark forest green at top of list → Light mint green at bottom
 */
const GREEN_GRADIENT = {
  dark: '#1B5E20',    // Darkest green (top of list)
  light: '#A5D6A7',   // Lightest green (bottom of list)
};

/**
 * Gold/amber gradient range for "Short List" section
 * Dark goldenrod at top → Gold at bottom
 */
const GOLD_GRADIENT = {
  dark: '#B8860B',    // Darkest gold (top of list)
  light: '#FFD700',   // Lightest gold (bottom of list)
};

/**
 * Grey gradient range for "Completed" section
 * Dark charcoal at top → Light silver at bottom
 */
const GREY_GRADIENT = {
  dark: '#37474F',    // Darkest grey (top of list)
  light: '#B0BEC5',   // Lightest grey (bottom of list)
};

/**
 * Darken a hex color by a percentage
 */
function darkenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  const factor = 1 - percent;
  return rgbToHex(rgb.r * factor, rgb.g * factor, rgb.b * factor);
}

/**
 * Lighten a hex color by a percentage (towards white)
 */
function lightenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  return rgbToHex(
    rgb.r + (255 - rgb.r) * percent,
    rgb.g + (255 - rgb.g) * percent,
    rgb.b + (255 - rgb.b) * percent
  );
}

/**
 * Get position-based green color for "To Play" items
 * Each row has a subtle inner gradient: darker at top, lighter at bottom
 * @param index - Item's position in the list (0-based)
 * @param total - Total number of items in the list
 */
export function getPositionalGreen(index: number, total: number): GradientColor {
  // Avoid division by zero; single item gets darkest color
  const factor = total > 1 ? index / (total - 1) : 0;

  // Base color for this position in the list
  const baseColor = interpolateColor(GREEN_GRADIENT.dark, GREEN_GRADIENT.light, factor);

  // Create inner row gradient: top is slightly darker, bottom is base/slightly lighter
  return {
    primary: darkenColor(baseColor, 0.08),   // Top of row: 8% darker
    secondary: lightenColor(baseColor, 0.05), // Bottom of row: 5% lighter
  };
}

/**
 * Get position-based grey color for "Completed" items
 * Each row has a subtle inner gradient: darker at top, lighter at bottom
 * @param index - Item's position in the completed list (0-based)
 * @param total - Total number of completed items
 */
export function getPositionalGrey(index: number, total: number): GradientColor {
  // Avoid division by zero; single item gets darkest color
  const factor = total > 1 ? index / (total - 1) : 0;

  // Base color for this position in the list
  const baseColor = interpolateColor(GREY_GRADIENT.dark, GREY_GRADIENT.light, factor);

  // Create inner row gradient: top is slightly darker, bottom is base/slightly lighter
  return {
    primary: darkenColor(baseColor, 0.08),   // Top of row: 8% darker
    secondary: lightenColor(baseColor, 0.05), // Bottom of row: 5% lighter
  };
}

/**
 * Get position-based gold color for "Short List" items
 * Each row has a subtle inner gradient: darker at top, lighter at bottom
 * @param index - Item's position in the short list (0-based)
 * @param total - Total number of short list items
 */
export function getPositionalGold(index: number, total: number): GradientColor {
  // Avoid division by zero; single item gets darkest color
  const factor = total > 1 ? index / (total - 1) : 0;

  // Base color for this position in the list
  const baseColor = interpolateColor(GOLD_GRADIENT.dark, GOLD_GRADIENT.light, factor);

  // Create inner row gradient: top is slightly darker, bottom is base/slightly lighter
  return {
    primary: darkenColor(baseColor, 0.08),   // Top of row: 8% darker
    secondary: lightenColor(baseColor, 0.05), // Bottom of row: 5% lighter
  };
}
