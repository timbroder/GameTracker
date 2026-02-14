/**
 * EditModal - Modal for viewing/editing game details
 *
 * Shown on long press of a game row.
 * Allows viewing game info and deleting the game.
 */

import React, { useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import type { Game } from '../types';
import {
  getGradientProps,
  getPositionalGreen,
  getPositionalGold,
  getPositionalGrey,
} from '../utils/colors';
import LinearGradient from 'react-native-linear-gradient';
import { useHaptics } from '../hooks/useHaptics';

const MAX_SHORT_LIST = 5;

export interface EditModalProps {
  game: Game | null;
  visible: boolean;
  shortListCount: number;
  onClose: () => void;
  onDelete: (gameId: string) => void;
  onToggleCompleted: (gameId: string) => void;
  onToggleShortList: (gameId: string) => void;
}

export function EditModal({
  game,
  visible,
  shortListCount,
  onClose,
  onDelete,
  onToggleCompleted,
  onToggleShortList,
}: EditModalProps) {
  const haptics = useHaptics();

  const handleDelete = useCallback(() => {
    if (game) {
      haptics.warning();
      onDelete(game.id);
      onClose();
    }
  }, [game, onDelete, onClose, haptics]);

  const handleToggleCompleted = useCallback(() => {
    if (game) {
      haptics.light();
      onToggleCompleted(game.id);
      onClose();
    }
  }, [game, onToggleCompleted, onClose, haptics]);

  const handleToggleShortList = useCallback(() => {
    if (!game) return;
    if (!game.isShortListed && shortListCount >= MAX_SHORT_LIST) {
      Alert.alert('Short List Full', 'Remove a game from the Short List first (max 5).');
      return;
    }
    haptics.light();
    onToggleShortList(game.id);
    onClose();
  }, [game, shortListCount, onToggleShortList, onClose, haptics]);

  const handleClose = useCallback(() => {
    haptics.light();
    onClose();
  }, [onClose, haptics]);

  if (!game) {
    return null;
  }

  // Use section-based colors: darkest shade (index 0, total 1) for the header
  const getHeaderColor = () => {
    if (game.isCompleted) return getPositionalGrey(0, 1);
    if (game.isShortListed) return getPositionalGold(0, 1);
    return getPositionalGreen(0, 1);
  };
  const gradientProps = getGradientProps(getHeaderColor());

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollContainer} bounces={false}>
          {/* Header with gradient */}
          <LinearGradient {...gradientProps} style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Text style={styles.closeButtonText}>Done</Text>
            </TouchableOpacity>

            {game.boxArtUrl ? (
              <FastImage
                source={{
                  uri: game.boxArtUrl,
                  priority: FastImage.priority.high,
                  cache: FastImage.cacheControl.immutable,
                }}
                style={styles.boxArt}
                resizeMode={FastImage.resizeMode.cover}
              />
            ) : (
              <View style={[styles.boxArt, styles.boxArtPlaceholder]}>
                <Text style={styles.placeholderText}>🎮</Text>
              </View>
            )}

            <Text style={styles.gameName} numberOfLines={2}>{game.name}</Text>
            <Text style={styles.platform}>{game.platform}</Text>
          </LinearGradient>

          {/* Content */}
          <View style={styles.content}>
            {/* Status */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Status</Text>
              <TouchableOpacity
                style={styles.statusButton}
                onPress={handleToggleCompleted}
              >
                <Text style={styles.statusButtonText}>
                  {game.isCompleted ? '✓ Completed' : '○ Not Played'}
                </Text>
                <Text style={styles.statusHint}>Tap to toggle</Text>
              </TouchableOpacity>
            </View>

            {/* Short List toggle (only for non-completed games) */}
            {!game.isCompleted && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Short List</Text>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    game.isShortListed && styles.shortListButtonActive,
                  ]}
                  onPress={handleToggleShortList}
                >
                  <Text style={styles.statusButtonText}>
                    {game.isShortListed ? '★ On Short List' : '☆ Add to Short List'}
                  </Text>
                  <Text style={styles.statusHint}>
                    {game.isShortListed ? 'Tap to remove' : `${shortListCount}/${MAX_SHORT_LIST}`}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Details</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Added</Text>
                <Text style={styles.detailValue}>
                  {new Date(game.dateAdded).toLocaleDateString()}
                </Text>
              </View>
              {game.isCompleted && game.completedDate && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Completed</Text>
                  <Text style={styles.detailValue}>
                    {new Date(game.completedDate).toLocaleDateString()}
                  </Text>
                </View>
              )}
              {game.playtimeHours !== undefined && game.playtimeHours > 0 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Playtime</Text>
                  <Text style={styles.detailValue}>
                    {game.playtimeHours} hours
                  </Text>
                </View>
              )}
            </View>

            {/* Delete Button */}
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
            >
              <Text style={styles.deleteButtonText}>Delete Game</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  closeButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  boxArt: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  boxArtPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 48,
  },
  gameName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  platform: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  statusButton: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  statusHint: {
    color: '#666',
    fontSize: 13,
  },
  shortListButtonActive: {
    borderWidth: 1,
    borderColor: '#B8860B',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  detailLabel: {
    color: '#888',
    fontSize: 15,
  },
  detailValue: {
    color: '#FFF',
    fontSize: 15,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 'auto',
  },
  deleteButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditModal;
