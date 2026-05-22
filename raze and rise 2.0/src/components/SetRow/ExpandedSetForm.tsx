/**
 * ExpandedSetForm — inline expanded form rendered below SetRow.
 *
 * Renders four rows per UI-SPEC.md SetRow Expanded State diagram:
 *   Row 1: "RPE" label + RPEStepper (1–10)
 *   Row 2: "Warm-up" label + Toggle (binary on/off)
 *   Row 3: "Note" label + multiline TextInput (3 lines, freetext)
 *   Row 4: "Quick tags:" label + 5× QuickTagChip
 *
 * Notes are stored as JSON-serialized SetNotes shape:
 *   { tags: QuickTag[], text: string }
 * On parse failure (legacy/malformed), treats raw string as text with empty tags (T-02-05).
 *
 * Each interactive control:
 *   - Calls the corresponding sessionStore action (setSetRpe/setSetWarmup/setSetNotes)
 *   - Calls commitSet with updated values for PowerSync persistence
 *   - Fires Haptics.selectionAsync() (RPE + warmup + quick-tags)
 *
 * Note text: serialized only on TextInput blur (to avoid write storm on each keystroke).
 *
 * All Text uses allowFontScaling={false} per Phase 2 policy.
 */

import React, { useState } from 'react';
import { View, Text, TextInput as RNTextInput } from 'react-native';
import * as Haptics from 'expo-haptics';

import { useSessionStore } from '@/stores/sessionStore';
import { SetResult } from '@/hooks/useSetResult';
import { commitSet, serializeSetNotes, parseSetNotes } from '@/services/sessionService';
import { RPEStepper } from '@/components/RPEStepper';
import { Toggle } from '@/components/Toggle';
import { QuickTagChip, QuickTag } from '@/components/QuickTagChip';

// ── Props ─────────────────────────────────────────────────────────────────────

export interface ExpandedSetFormProps {
  setId: string;
  sessionId: string;
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  weightKg: number | null;
  repsTarget: string;
  result: SetResult;
}

// ── Quick tag definitions (UI-SPEC.md Copywriting Contract) ──────────────────

const QUICK_TAGS: QuickTag[] = ['easy', 'hard', 'good form', 'bad form', 'pain'];

// ── Warm-up toggle options ───────────────────────────────────────────────────

const WARMUP_OPTIONS: [{ label: string; value: 'on' }, { label: string; value: 'off' }] = [
  { label: 'On', value: 'on' },
  { label: 'Off', value: 'off' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function ExpandedSetForm({
  setId,
  sessionId,
  exerciseId,
  exerciseName,
  setNumber,
  weightKg,
  repsTarget,
  result,
}: ExpandedSetFormProps) {
  // ── Zustand state ─────────────────────────────────────────────────────────

  const rpe = useSessionStore((s) => {
    for (const ex of s.exercises) {
      const set = ex.sets.find((st) => st.id === setId);
      if (set) return set.rpe;
    }
    return null;
  });

  const isWarmup = useSessionStore((s) => {
    for (const ex of s.exercises) {
      const set = ex.sets.find((st) => st.id === setId);
      if (set) return set.isWarmup;
    }
    return false;
  });

  const notesJson = useSessionStore((s) => {
    for (const ex of s.exercises) {
      const set = ex.sets.find((st) => st.id === setId);
      if (set) return set.notes;
    }
    return null;
  });

  const setSetRpe = useSessionStore((s) => s.setSetRpe);
  const setSetWarmup = useSessionStore((s) => s.setSetWarmup);
  const setSetNotes = useSessionStore((s) => s.setSetNotes);

  // ── Parse notes JSON (T-02-05: graceful fallback on malformed JSON) ───────

  const parsedNotes = parseSetNotes(notesJson);

  // Local text state (ephemeral — persisted on blur)
  const [noteText, setNoteText] = useState<string>(parsedNotes.text);

  // ── Helper: commit current state with updated field ───────────────────────

  const buildCommitOpts = (overrides: {
    rpe?: number | null;
    isWarmup?: boolean;
    notes?: string | null;
  }) => ({
    setId,
    sessionId,
    exerciseId,
    exerciseName,
    setNumber,
    weightKg,
    repsTarget,
    result,
    rpe: overrides.rpe !== undefined ? overrides.rpe : rpe,
    isWarmup: overrides.isWarmup !== undefined ? overrides.isWarmup : isWarmup,
    notes: overrides.notes !== undefined ? overrides.notes : notesJson,
  });

  // ── RPE handler ───────────────────────────────────────────────────────────

  const handleRpeChange = async (newRpe: number) => {
    await Haptics.selectionAsync();
    setSetRpe(setId, newRpe);
    await commitSet(buildCommitOpts({ rpe: newRpe }));
  };

  // ── Warm-up handler ───────────────────────────────────────────────────────

  const handleWarmupChange = async (v: 'on' | 'off') => {
    await Haptics.selectionAsync();
    const newIsWarmup = v === 'on';
    setSetWarmup(setId, newIsWarmup);
    await commitSet(buildCommitOpts({ isWarmup: newIsWarmup }));
  };

  // ── Note text handler (persisted on blur) ─────────────────────────────────

  const handleNoteBlur = async () => {
    const serialized = serializeSetNotes(parsedNotes.tags, noteText);
    setSetNotes(setId, serialized);
    await commitSet(buildCommitOpts({ notes: serialized }));
  };

  // ── Quick-tag handler ─────────────────────────────────────────────────────

  const handleTagPress = async (tag: QuickTag) => {
    await Haptics.selectionAsync();
    const currentTags = parsedNotes.tags as QuickTag[];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];
    const serialized = serializeSetNotes(newTags, noteText);
    setSetNotes(setId, serialized);
    await commitSet(buildCommitOpts({ notes: serialized }));
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View className="p-lg gap-md border-t border-border">
      {/* Row 1: RPE */}
      <View className="flex-row items-center gap-sm">
        <Text className="text-caption text-fg-muted w-16" allowFontScaling={false}>
          RPE
        </Text>
        <RPEStepper value={rpe} onChange={handleRpeChange} />
      </View>

      {/* Row 2: Warm-up */}
      <View className="flex-row items-center gap-sm">
        <Text className="text-caption text-fg-muted w-16" allowFontScaling={false}>
          Warm-up
        </Text>
        <Toggle
          options={WARMUP_OPTIONS}
          value={isWarmup ? 'on' : 'off'}
          onChange={handleWarmupChange}
          haptics={false}
        />
      </View>

      {/* Row 3: Free-text note */}
      <View className="gap-xs">
        <Text className="text-caption text-fg-muted" allowFontScaling={false}>
          Note
        </Text>
        <RNTextInput
          className="bg-bg-input border border-border rounded-sm px-md py-sm text-body text-fg"
          allowFontScaling={false}
          multiline
          numberOfLines={3}
          placeholder="Optional free text..."
          placeholderTextColor="#99907C"
          value={noteText}
          onChangeText={setNoteText}
          onBlur={handleNoteBlur}
          style={{ textAlignVertical: 'top', minHeight: 72 }}
        />
      </View>

      {/* Row 4: Quick tags */}
      <View className="gap-xs">
        <Text className="text-caption text-fg-muted" allowFontScaling={false}>
          Quick tags:
        </Text>
        <View className="flex-row flex-wrap gap-sm">
          {QUICK_TAGS.map((tag) => (
            <QuickTagChip
              key={tag}
              tag={tag}
              selected={(parsedNotes.tags as QuickTag[]).includes(tag)}
              onPress={() => handleTagPress(tag)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

export default ExpandedSetForm;
