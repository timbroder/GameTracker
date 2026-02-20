/**
 * Top10Graphic - Static shareable image of the user's top 10 games
 *
 * Designed for screenshot capture: fixed width, no interactivity.
 * Reuses positional color system from the main list.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import type { Game } from '../types';
import {
  getGradientProps,
  getPositionalGold,
  getPositionalGreen,
} from '../utils/colors';

const ROW_HEIGHT = 72;
const BOX_ART_SIZE = 48;
const GRAPHIC_WIDTH = 390;

interface Top10GraphicProps {
  shortList: Game[];
  toPlay: Game[];
  totalToPlayCount: number;
  somedayMaybeCount: number;
  completedCount: number;
  onReady: () => void;
}

function GraphicRow({
  game,
  index,
  total,
  section,
  onImageLoaded,
}: {
  game: Game;
  index: number;
  total: number;
  section: 'shortList' | 'toPlay';
  onImageLoaded: () => void;
}) {
  const color =
    section === 'shortList'
      ? getPositionalGold(index, total)
      : getPositionalGreen(index, total);
  const gradientProps = getGradientProps(color);

  const handleLoad = useCallback(() => {
    onImageLoaded();
  }, [onImageLoaded]);

  const handleError = useCallback(() => {
    onImageLoaded(); // Count errors as loaded
  }, [onImageLoaded]);

  return (
    <View style={rowStyles.container}>
      <LinearGradient {...gradientProps} style={StyleSheet.absoluteFill} />
      <View style={rowStyles.content}>
        {game.boxArtUrl ? (
          <FastImage
            source={{
              uri: game.boxArtUrl,
              priority: FastImage.priority.high,
              cache: FastImage.cacheControl.immutable,
            }}
            style={rowStyles.boxArt}
            resizeMode={FastImage.resizeMode.cover}
            onLoad={handleLoad}
            onError={handleError}
          />
        ) : (
          <View style={[rowStyles.boxArt, rowStyles.placeholder]}>
            <Text style={rowStyles.placeholderText}>?</Text>
          </View>
        )}
        <View style={rowStyles.info}>
          <Text style={rowStyles.gameName} numberOfLines={1}>
            {game.name}
          </Text>
          <Text style={rowStyles.platform} numberOfLines={1}>
            {game.platform}
          </Text>
        </View>
      </View>
    </View>
  );
}

export function Top10Graphic({ shortList, toPlay, totalToPlayCount, somedayMaybeCount, completedCount, onReady }: Top10GraphicProps) {
  const totalImages = useRef(0);
  const loadedImages = useRef(0);
  const hasCalledReady = useRef(false);
  const [layoutDone, setLayoutDone] = useState(false);

  // Count total images that need loading
  const allGames = [...shortList, ...toPlay];
  const imageCount = allGames.filter((g) => g.boxArtUrl).length;
  totalImages.current = imageCount;

  const tryReady = useCallback(() => {
    if (hasCalledReady.current) return;
    if (layoutDone && (loadedImages.current >= totalImages.current || totalImages.current === 0)) {
      hasCalledReady.current = true;
      onReady();
    }
  }, [layoutDone, onReady]);

  const handleImageLoaded = useCallback(() => {
    loadedImages.current += 1;
    tryReady();
  }, [tryReady]);

  // Check readiness when layout completes
  useEffect(() => {
    if (layoutDone) {
      tryReady();
    }
  }, [layoutDone, tryReady]);

  // Safety timeout: capture after 3s regardless
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasCalledReady.current) {
        hasCalledReady.current = true;
        onReady();
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [onReady]);

  const handleLayout = useCallback(() => {
    setLayoutDone(true);
  }, []);

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {/* Title */}
      <View style={styles.titleBar}>
        <Text style={styles.titleText}>MY TOP 10</Text>
      </View>

      {/* Short List section */}
      {shortList.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>
              SHORT LIST ({shortList.length}/5)
            </Text>
          </View>
          {shortList.map((game, idx) => (
            <GraphicRow
              key={game.id}
              game={game}
              index={idx}
              total={shortList.length}
              section="shortList"
              onImageLoaded={handleImageLoaded}
            />
          ))}
        </>
      )}

      {/* To Play section */}
      {toPlay.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>
              TO PLAY ({totalToPlayCount})
            </Text>
          </View>
          {toPlay.map((game, idx) => (
            <GraphicRow
              key={game.id}
              game={game}
              index={idx}
              total={toPlay.length}
              section="toPlay"
              onImageLoaded={handleImageLoaded}
            />
          ))}
        </>
      )}

      {/* Other section counts */}
      {(somedayMaybeCount > 0 || completedCount > 0) && (
        <View style={styles.summaryCounts}>
          {somedayMaybeCount > 0 && (
            <Text style={styles.summaryText}>Someday, Maybe ({somedayMaybeCount})</Text>
          )}
          {completedCount > 0 && (
            <Text style={styles.summaryText}>Played ({completedCount})</Text>
          )}
        </View>
      )}

      {/* Footer branding */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>GameTracker</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: GRAPHIC_WIDTH,
    backgroundColor: '#000',
  },
  titleBar: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  titleText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 2,
  },
  sectionHeader: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#111',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  sectionHeaderText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  summaryCounts: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  summaryText: {
    color: '#555',
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  footerText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '500',
  },
});

const rowStyles = StyleSheet.create({
  container: {
    height: ROW_HEIGHT,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingLeft: 12,
    paddingRight: 16,
  },
  boxArt: {
    width: BOX_ART_SIZE,
    height: BOX_ART_SIZE,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  info: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  gameName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 3,
  },
  platform: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});

export default Top10Graphic;
