/**
 * SessionNoteSheet — bottom-sheet free-text note editor for the active session.
 *
 * Opened via StickyNote IconButton in SessionHeader (WORKOUT-09).
 * Auto-saves on dismiss — no explicit Save button (UI-SPEC.md: "auto-saves on dismiss").
 *
 * Design (UI-SPEC.md Component Inventory — SessionNoteSheet):
 *   - RN Modal (same bottom-sheet shell as ExerciseSwapModal)
 *   - Header: "Session note" + X IconButton (close)
 *   - Body text: "What's worth remembering about today's session?"
 *   - Multiline TextInput, 6 lines visible, auto-saves on dismiss
 *   - Placeholder: "Felt strong on bench, knee twinge on squats..."
 *   - NO Save button — auto-saves on dismiss (X tap, backdrop tap, or hardware back)
 *
 * Save flow:
 *   1. User edits text in local state (seeded from initialValue)
 *   2. On close (any path): call onSave(currentText) THEN onClose()
 *   3. Parent (SessionScreen) stores notes in sessionStore.sessionNotes
 *   4. completeSession reads sessionNotes from store and passes it to the sessions row
 *
 * All Text uses allowFontScaling={false} per Phase 2 policy.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Modal, Pressable } from 'react-native';
import { X } from 'lucide-react-native';

import { TextInput } from '@/components/TextInput';
import { IconButton } from '@/components/IconButton';

// ── Props ─────────────────────────────────────────────────────────────────────

interface SessionNoteSheetProps {
  visible: boolean;
  /** Current notes value — seeds the local editor state when the sheet opens */
  initialValue: string;
  /** Called with the latest text when the sheet is dismissed (auto-save) */
  onSave: (notes: string) => void;
  /** Called after onSave — hides the sheet */
  onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SessionNoteSheet({
  visible,
  initialValue,
  onSave,
  onClose,
}: SessionNoteSheetProps) {
  // Local state — seeded from initialValue when the sheet opens
  const [text, setText] = useState(initialValue);

  // Re-seed local state when sheet opens (initialValue may have changed since last open)
  useEffect(() => {
    if (visible) {
      setText(initialValue);
    }
  }, [visible, initialValue]);

  // Auto-save on any dismiss path: X tap, backdrop tap, or hardware back
  const handleDismiss = () => {
    onSave(text);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      presentationStyle="overFullScreen"
      onRequestClose={handleDismiss}
      statusBarTranslucent
    >
      {/* Backdrop — tap to dismiss and auto-save */}
      <Pressable
        className="flex-1 bg-black/50"
        onPress={handleDismiss}
        accessibilityLabel="Close note sheet"
      >
        {/* Sheet — stops backdrop press propagation */}
        <Pressable
          className="absolute bottom-0 left-0 right-0 bg-bg-elevated rounded-t-lg p-md"
          style={{
            shadowColor: '#000',
            shadowOpacity: 0.7,
            shadowRadius: 32,
            shadowOffset: { width: 0, height: -8 },
            elevation: 24,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header row */}
          <View className="flex-row items-center justify-between mb-sm">
            <Text className="text-body font-bold text-fg" allowFontScaling={false}>
              Session note
            </Text>
            <IconButton
              icon={<X size={20} color="#99907C" />}
              onPress={handleDismiss}
              accessibilityLabel="Close note and save"
            />
          </View>

          {/* Body copy */}
          <Text className="text-body text-fg-muted mb-sm" allowFontScaling={false}>
            What's worth remembering about today's session?
          </Text>

          {/* Multiline text input — auto-saves on dismiss (no Save button) */}
          <TextInput
            multiline={true}
            numberOfLines={6}
            textAlignVertical="top"
            placeholder="Felt strong on bench, knee twinge on squats..."
            value={text}
            onChangeText={setText}
            style={{ height: 144 }}
          />

          {/* Spacer for keyboard avoidance */}
          <View className="h-md" />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default SessionNoteSheet;
