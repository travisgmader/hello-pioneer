/**
 * SplitSelector — onboarding step 2 content.
 *
 * Shows 5 split option cards with weekly schedule previews.
 * Selected card: border-border-strong + bg-elevated + Check icon top-right.
 * Haptics.impactAsync(Light) on tap.
 *
 * Weekly schedule preview: 7 small circles representing Mon–Sun.
 *   Filled (workout day): bg-accent-dim
 *   Empty (rest day): bg-border
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export type SplitId = 'ppl' | 'upper-lower' | 'full-body' | 'body-part' | 'af-pt';

interface SplitOption {
  id: SplitId;
  label: string;
  subtitle: string;
  /** 7 booleans: true = workout day, false = rest day (Mon–Sun) */
  schedule: boolean[];
}

const SPLIT_OPTIONS: SplitOption[] = [
  {
    id: 'ppl',
    label: 'Push / Pull / Legs',
    subtitle: '6 days · classic hypertrophy split',
    schedule: [true, true, true, true, true, true, false],
  },
  {
    id: 'upper-lower',
    label: 'Upper / Lower',
    subtitle: '4 days · balanced volume and recovery',
    schedule: [true, true, false, true, true, false, false],
  },
  {
    id: 'full-body',
    label: 'Full Body',
    subtitle: '3 days · time-efficient, beginner-friendly',
    schedule: [true, false, true, false, true, false, false],
  },
  {
    id: 'body-part',
    label: 'Body Part',
    subtitle: '5 days · bodybuilder-style focus per day',
    schedule: [true, true, true, true, true, false, false],
  },
  {
    id: 'af-pt',
    label: 'AF PT Prep',
    subtitle: 'Run, push-ups, pull-ups, sit-ups',
    schedule: [true, true, true, true, true, false, false],
  },
];

interface SplitSelectorProps {
  selected: SplitId | null;
  onSelect: (id: SplitId) => void;
}

function WeekPreview({ schedule }: { schedule: boolean[] }) {
  return (
    <View className="flex-row gap-xs mt-sm">
      {schedule.map((isWorkout, i) => (
        <View
          key={i}
          className={[
            'w-7 h-7 rounded-full',
            isWorkout ? 'bg-accent-dim' : 'bg-border',
          ].join(' ')}
        />
      ))}
    </View>
  );
}

function SplitCard({
  option,
  selected,
  onPress,
}: {
  option: SplitOption;
  selected: boolean;
  onPress: () => void;
}) {
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
      accessibilityLabel={option.label}
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
        {option.label}
      </Text>
      <Text
        className="text-caption text-fg-muted mt-xs"
        allowFontScaling={false}
      >
        {option.subtitle}
      </Text>
      <WeekPreview schedule={option.schedule} />
    </Pressable>
  );
}

/**
 * SplitSelector renders the list of split option cards.
 * Controlled by selected/onSelect from parent.
 */
export function SplitSelector({ selected, onSelect }: SplitSelectorProps) {
  return (
    <View className="gap-sm">
      {SPLIT_OPTIONS.map((option) => (
        <SplitCard
          key={option.id}
          option={option}
          selected={selected === option.id}
          onPress={() => onSelect(option.id)}
        />
      ))}
    </View>
  );
}

export { SPLIT_OPTIONS };
export default SplitSelector;
