/**
 * QuickTagChip — set-note quick-tag chip atom.
 *
 * Wraps the Phase 1 Chip with specific labels per UI-SPEC.md Copywriting Contract:
 *   easy      → "Easy"
 *   hard      → "Hard"
 *   good form → "Good form"
 *   bad form  → "Bad form"
 *   pain      → "Pain" (with AlertOctagon 14px #EF4444 danger icon prefix)
 *
 * For the `pain` tag, renders an AlertOctagon icon passed to Chip's icon prop.
 * Forwards selected + onPress to Chip. haptics=true on Chip.
 *
 * UI-SPEC.md: QuickTagChip quick tags row in expanded set form.
 * Tags stored as JSON in session_sets.notes (Plan 05 introduces SetNotes shape).
 *
 * allowFontScaling={false}: inherited from Chip component.
 */

import React from 'react';
import { View } from 'react-native';
import { AlertOctagon } from 'lucide-react-native';
import { Chip } from '@/components/Chip';

export type QuickTag = 'easy' | 'hard' | 'good form' | 'bad form' | 'pain';

interface QuickTagChipProps {
  tag: QuickTag;
  selected: boolean;
  onPress: () => void;
}

const TAG_LABELS: Record<QuickTag, string> = {
  easy: 'Easy',
  hard: 'Hard',
  'good form': 'Good form',
  'bad form': 'Bad form',
  pain: 'Pain',
};

export function QuickTagChip({ tag, selected, onPress }: QuickTagChipProps) {
  const label = TAG_LABELS[tag];

  // For the pain tag, prepend an AlertOctagon danger icon (14px, #EF4444)
  const icon =
    tag === 'pain' ? (
      <View style={{ marginBottom: 0 }}>
        <AlertOctagon size={14} color="#EF4444" />
      </View>
    ) : undefined;

  return (
    <Chip
      label={label}
      selected={selected}
      onPress={onPress}
      icon={icon}
      haptics
    />
  );
}

export default QuickTagChip;
