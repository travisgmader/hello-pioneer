/**
 * TemplateBuilder — onboarding step 3 content (stub).
 *
 * Displays template day cards filtered by the selected split type.
 * Each card shows: day label, first 3 exercises + "and N more", exercise count.
 * Selected card: border-border-strong + bg-elevated.
 *
 * Full template customization ships in Phase 2 (Split tab).
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export interface TemplateDay {
  day_label: string;
  exercises: string[];
}

interface TemplateDayCardProps {
  day: TemplateDay;
  selected: boolean;
  onPress: () => void;
}

function TemplateDayCard({ day, selected, onPress }: TemplateDayCardProps) {
  const previewExercises = day.exercises.slice(0, 3);
  const remaining = day.exercises.length - previewExercises.length;
  const exerciseSummary =
    remaining > 0
      ? `${previewExercises.join(', ')} and ${remaining} more`
      : previewExercises.join(', ');

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      className={[
        'rounded-lg p-md border relative active:opacity-80',
        selected
          ? 'bg-bg-elevated border-border-strong'
          : 'bg-bg-elevated border-border',
      ].join(' ')}
      onPress={handlePress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={day.day_label}
    >
      {selected && (
        <View className="absolute top-sm right-sm">
          <Check size={16} color="#F2CA50" />
        </View>
      )}
      <Text
        className="text-body font-bold text-fg"
        allowFontScaling={false}
      >
        {day.day_label}
      </Text>
      <Text
        className="text-caption text-fg-muted mt-xs"
        allowFontScaling={false}
        numberOfLines={2}
      >
        {exerciseSummary}
      </Text>
      <Text
        className="text-caption text-fg-muted mt-xs"
        allowFontScaling={false}
      >
        {`${day.exercises.length} exercises`}
      </Text>
    </Pressable>
  );
}

interface TemplateBuilderProps {
  days: TemplateDay[];
  selectedDayLabel: string | null;
  onSelectDay: (dayLabel: string) => void;
}

/**
 * TemplateBuilder renders the list of template day cards for the selected split.
 * Controlled by selectedDayLabel/onSelectDay from the parent screen.
 */
export function TemplateBuilder({
  days,
  selectedDayLabel,
  onSelectDay,
}: TemplateBuilderProps) {
  return (
    <View className="gap-sm">
      {days.map((day) => (
        <TemplateDayCard
          key={day.day_label}
          day={day}
          selected={selectedDayLabel === day.day_label}
          onPress={() => onSelectDay(day.day_label)}
        />
      ))}
    </View>
  );
}

export default TemplateBuilder;
