/**
 * GameRow - Clear-style game row component
 *
 * Displays a single game with gradient background, box art, and platform info.
 * Supports completed state with grey coloring.
 */

import React, { memo } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import type { Game } from '../types';
import {
  getGameColor,
  getGradientProps,
  COMPLETED_OPACITY,
} from '../utils/colors';

export interface GameRowProps {
  game: Game;
  onSwipe?: (gameId: string) => void;
  onLongPress?: (gameId: string) => void;
  onPinch?: (gameId: string) => void;
}

/**
 * Row height as specified in design
 */
export const GAME_ROW_HEIGHT = 80;

/**
 * Placeholder component for missing box art
 */
function BoxArtPlaceholder() {
  return (
    <View style={[styles.boxArt, styles.boxArtPlaceholder]}>
      <Text style={styles.placeholderText}>🎮</Text>
    </View>
  );
}

/**
 * Box art image with loading state and error fallback
 */
function BoxArt({ url }: { url: string }) {
  const [hasError, setHasError] = React.useState(false);

  if (!url || hasError) {
    return <BoxArtPlaceholder />;
  }

  return (
    <Image
      source={{ uri: url }}
      style={styles.boxArt}
      resizeMode="cover"
      onError={() => setHasError(true)}
    />
  );
}

/**
 * Platform badge showing platform name
 * Falls back to text if no logo available
 */
function PlatformBadge({
  name,
  logoUrl,
}: {
  name: string;
  logoUrl?: string;
}) {
  const [hasError, setHasError] = React.useState(false);

  // If we have a logo URL and it hasn't errored, show the image
  if (logoUrl && !hasError) {
    return (
      <Image
        source={{ uri: logoUrl }}
        style={styles.platformLogo}
        resizeMode="contain"
        onError={() => setHasError(true)}
      />
    );
  }

  // Fallback to abbreviated text
  const abbreviation = getPlatformAbbreviation(name);
  return (
    <View style={styles.platformBadge}>
      <Text style={styles.platformBadgeText}>{abbreviation}</Text>
    </View>
  );
}

/**
 * Get abbreviated platform name for badge
 */
function getPlatformAbbreviation(name: string): string {
  const abbreviations: Record<string, string> = {
    'PlayStation 5': 'PS5',
    'PlayStation 4': 'PS4',
    'PlayStation 3': 'PS3',
    'PlayStation 2': 'PS2',
    PlayStation: 'PS1',
    'Xbox Series S/X': 'XSX',
    'Xbox One': 'XB1',
    'Xbox 360': 'X360',
    Xbox: 'Xbox',
    'Nintendo Switch': 'NSW',
    'Nintendo 3DS': '3DS',
    'Nintendo DS': 'NDS',
    Wii: 'Wii',
    'Wii U': 'WiiU',
    PC: 'PC',
    macOS: 'Mac',
    Linux: 'Linux',
    iOS: 'iOS',
    Android: 'And',
  };

  return abbreviations[name] || name.substring(0, 4);
}

/**
 * GameRow component
 */
function GameRowComponent({ game }: GameRowProps) {
  const color = getGameColor(game.colorIndex, game.isCompleted);
  const opacity = game.isCompleted ? COMPLETED_OPACITY : 1;
  const gradientProps = getGradientProps(color, opacity);

  return (
    <LinearGradient
      {...gradientProps}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Box Art */}
        <BoxArt url={game.boxArtUrl} />

        {/* Game Info */}
        <View style={styles.info}>
          <Text
            style={[
              styles.gameName,
              game.isCompleted && styles.completedText,
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {game.name}
          </Text>
          <Text
            style={[
              styles.platformName,
              game.isCompleted && styles.completedText,
            ]}
            numberOfLines={1}
          >
            {game.platform}
          </Text>
        </View>

        {/* Platform Badge */}
        <PlatformBadge
          name={game.platform}
          logoUrl={game.platformLogoUrl}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    height: GAME_ROW_HEIGHT,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  boxArt: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  boxArtPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 24,
  },
  info: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
    justifyContent: 'center',
  },
  gameName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  platformName: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  completedText: {
    opacity: 0.7,
  },
  platformLogo: {
    width: 24,
    height: 24,
  },
  platformBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  platformBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export const GameRow = memo(GameRowComponent);
export default GameRow;
