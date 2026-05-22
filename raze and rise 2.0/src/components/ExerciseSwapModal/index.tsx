/**
 * ExerciseSwapModal — bottom-sheet exercise picker for swapping an exercise.
 *
 * Opens when the user taps the Shuffle IconButton in ExerciseCard.
 * Swap applies to the CURRENT SESSION ONLY — does NOT write to template_exercises (T-02-12).
 *
 * Design (UI-SPEC.md Component Inventory — ExerciseSwapModal):
 *   - RN Modal (animationType='slide', transparent + overFullScreen presentationStyle)
 *   - Backdrop: semi-transparent black overlay (tap to dismiss)
 *   - Sheet: bg-bg-elevated rounded-t-lg with shadow
 *   - Header: "Swap exercise" + X Cancel button (right-aligned)
 *   - Search: Phase 1 TextInput (placeholder "Search exercises...")
 *   - Exercise list: FlashList (56pt rows; name text-body text-fg + muscle text-caption text-fg-muted)
 *   - Footer: "Swap applies to this session only." caption
 *   - Empty state: `No exercises match "${query}".`
 *
 * Data: reads exercises table via PowerSync usePowerSyncQuery.
 * On row tap: Haptics.selectionAsync() + calls onSelect + closes modal.
 *
 * Modal is rendered ONCE in SessionScreen (not per card) — state driven by
 * Zustand swapModalForExerciseId. This avoids mounting one Modal per card in FlashList.
 *
 * Per STATE.md mandate: FlashList must be used for any dense list (not FlatList).
 *
 * All Text uses allowFontScaling={false} per Phase 2 policy.
 */

import React, { useState, useCallback } from 'react';
import { View, Text, Modal, Pressable } from 'react-native';
import { X } from 'lucide-react-native';
import { FlashList } from '@shopify/flash-list';
import * as Haptics from 'expo-haptics';

import { usePowerSyncQuery } from '@powersync/react-native';
import { TextInput } from '@/components/TextInput';
import { IconButton } from '@/components/IconButton';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ExerciseRow {
  id: string;
  name: string;
  primary_muscle: string;
}

export interface SwapExerciseResult {
  id: string;
  name: string;
  primaryMuscle: string;
}

interface ExerciseSwapModalProps {
  visible: boolean;
  currentExerciseName: string;
  onSelect: (newExercise: SwapExerciseResult) => void;
  onClose: () => void;
}

// ── Exercise row item ─────────────────────────────────────────────────────────

interface ExerciseRowItemProps {
  item: ExerciseRow;
  onPress: (item: ExerciseRow) => void;
}

function ExerciseRowItem({ item, onPress }: ExerciseRowItemProps) {
  return (
    <Pressable
      className="h-14 px-md flex-row items-center justify-between active:opacity-80"
      onPress={() => onPress(item)}
      accessibilityRole="button"
      accessibilityLabel={`Select ${item.name}`}
    >
      <View className="flex-1">
        <Text className="text-body text-fg" allowFontScaling={false}>
          {item.name}
        </Text>
        <Text className="text-caption text-fg-muted" allowFontScaling={false}>
          {item.primary_muscle}
        </Text>
      </View>
    </Pressable>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ExerciseSwapModal({
  visible,
  currentExerciseName,
  onSelect,
  onClose,
}: ExerciseSwapModalProps) {
  const [query, setQuery] = useState('');

  // Read exercises table via PowerSync local SQLite
  // ORDER BY primary_muscle, name for logical grouping
  const { data: allExercises } = usePowerSyncQuery<ExerciseRow>(
    `SELECT id, name, primary_muscle FROM exercises ORDER BY primary_muscle, name`,
    []
  );

  // Filter client-side by query against name OR primary_muscle
  const filteredExercises = React.useMemo(() => {
    const exercises = allExercises ?? [];
    if (!query.trim()) return exercises;
    const q = query.toLowerCase();
    return exercises.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.primary_muscle.toLowerCase().includes(q)
    );
  }, [allExercises, query]);

  const handleRowPress = useCallback(
    async (item: ExerciseRow) => {
      await Haptics.selectionAsync();
      onSelect({
        id: item.id,
        name: item.name,
        primaryMuscle: item.primary_muscle,
      });
    },
    [onSelect]
  );

  const renderItem = useCallback(
    ({ item }: { item: ExerciseRow }) => (
      <ExerciseRowItem item={item} onPress={handleRowPress} />
    ),
    [handleRowPress]
  );

  // Reset search query when modal closes
  const handleClose = useCallback(() => {
    setQuery('');
    onClose();
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      presentationStyle="overFullScreen"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      {/* Backdrop — tap to dismiss */}
      <Pressable
        className="flex-1 bg-black/50"
        onPress={handleClose}
        accessibilityLabel="Close exercise swap modal"
      >
        {/* Sheet — stops backdrop press propagation */}
        <Pressable
          className="absolute bottom-0 left-0 right-0 bg-bg-elevated rounded-t-lg"
          style={{
            shadowColor: '#000',
            shadowOpacity: 0.7,
            shadowRadius: 32,
            shadowOffset: { width: 0, height: -8 },
            elevation: 24,
            maxHeight: '80%',
          }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header row */}
          <View className="flex-row items-center justify-between px-md pt-md pb-sm">
            <Text className="text-body font-bold text-fg" allowFontScaling={false}>
              Swap exercise
            </Text>
            <IconButton
              icon={<X size={20} color="#99907C" />}
              onPress={handleClose}
              accessibilityLabel="Cancel"
            />
          </View>

          {/* Search field */}
          <View className="px-md pb-sm">
            <TextInput
              placeholder="Search exercises..."
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>

          {/* Exercise list (FlashList — per STATE.md mandate) */}
          <FlashList
            data={filteredExercises}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            estimatedItemSize={56}
            ListEmptyComponent={
              query.trim() ? (
                <View className="px-md py-lg">
                  <Text className="text-caption text-fg-muted" allowFontScaling={false}>
                    {`No exercises match "${query}".`}
                  </Text>
                </View>
              ) : null
            }
            style={{ maxHeight: 360 }}
          />

          {/* Footer caption */}
          <View className="px-md py-sm border-t border-border">
            <Text className="text-caption text-fg-muted text-center" allowFontScaling={false}>
              Swap applies to this session only.
            </Text>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default ExerciseSwapModal;
