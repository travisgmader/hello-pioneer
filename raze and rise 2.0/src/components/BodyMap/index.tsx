/**
 * BodyMap — anatomy SVG with tappable muscle region selection.
 *
 * Props:
 *   selected    — array of muscle IDs currently selected
 *   onToggle    — called with the muscleId when a region is tapped
 *
 * Layout:
 *   1. Toggle (Front / Back) to switch SVG view
 *   2. SVG anatomy (viewBox 0 0 200 400, centered)
 *   3. Selected chips list below SVG (tap chip to deselect)
 *
 * Selected muscle appearance:
 *   fill:   #F2CA50 (accent-dim)
 *   stroke: #D4AF37 (border-strong), strokeWidth 2
 *
 * Unselected:
 *   fill:   #1C1B1B (bg-elevated)
 *   stroke: transparent
 *
 * Security: T-02-16 — clamping of offset in BodyweightOffsetInput is handled there;
 * BodyMap only manages muscle selection (string IDs, non-PII enum — T-02-15 accepted).
 *
 * All Text uses allowFontScaling={false} per Phase 2 policy.
 */

import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

import { Toggle } from '@/components/Toggle';
import { FrontAnatomy, BackAnatomy } from './anatomy';

// ── Constants ─────────────────────────────────────────────────────────────────

/** Selected fill — accent-dim token */
const SELECTED_FILL = '#F2CA50';
/** Selected stroke — border-strong token */
const SELECTED_STROKE = '#D4AF37';
/** Unselected fill — bg-elevated token */
const UNSELECTED_FILL = '#1C1B1B';
/** Unselected stroke */
const UNSELECTED_STROKE = 'transparent';

// ── Props ─────────────────────────────────────────────────────────────────────

interface BodyMapProps {
  selected: string[];
  onToggle: (muscleId: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function BodyMap({ selected, onToggle }: BodyMapProps) {
  const [view, setView] = useState<'front' | 'back'>('front');

  const muscles = view === 'front' ? FrontAnatomy : BackAnatomy;

  const handleMusclePress = async (muscleId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle(muscleId);
  };

  // Build name lookup from the full list for the chip labels
  const allMuscles = [...FrontAnatomy, ...BackAnatomy];
  const muscleNameById = new Map(allMuscles.map((m) => [m.id, m.name]));

  return (
    <View className="items-center gap-md">
      {/* Front / Back toggle */}
      <Toggle
        options={[
          { label: 'Front', value: 'front' },
          { label: 'Back', value: 'back' },
        ]}
        value={view}
        onChange={(v) => setView(v as 'front' | 'back')}
      />

      {/* SVG anatomy */}
      <View className="items-center">
        <Svg
          viewBox="0 0 200 400"
          width={200}
          height={400}
          accessibilityLabel={`${view === 'front' ? 'Front' : 'Back'} body diagram`}
        >
          {muscles.map((muscle) => {
            const isSelected = selected.includes(muscle.id);
            return (
              <Path
                key={muscle.id}
                d={muscle.pathD}
                fill={isSelected ? SELECTED_FILL : UNSELECTED_FILL}
                stroke={isSelected ? SELECTED_STROKE : UNSELECTED_STROKE}
                strokeWidth={2}
                onPress={() => handleMusclePress(muscle.id)}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                accessibilityRole="button"
                accessibilityLabel={`${muscle.name}${isSelected ? ', selected' : ''}`}
                accessibilityState={{ selected: isSelected }}
              />
            );
          })}
        </Svg>
      </View>

      {/* Selected muscles chip list */}
      {selected.length > 0 && (
        <View className="w-full gap-xs">
          <Text
            className="text-caption text-fg-muted"
            allowFontScaling={false}
          >
            Selected:
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {selected.map((muscleId) => {
              const name = muscleNameById.get(muscleId) ?? muscleId;
              return (
                <Pressable
                  key={muscleId}
                  className="bg-accent-dim border border-border-strong rounded-md px-sm py-xs active:opacity-80"
                  onPress={() => handleMusclePress(muscleId)}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${name}`}
                >
                  <Text
                    className="text-caption text-fg font-bold"
                    allowFontScaling={false}
                  >
                    {name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

export default BodyMap;
