/**
 * ProfileStep — onboarding step 1 content.
 *
 * Collects: display name, units (lbs/kg), primary goal, age, sex, height, weight,
 * body fat % (optional). (ONBOARD-02)
 *
 * Continue enabled only when displayName.trim().length >= 1.
 * All measurement fields (age, height, weight, body fat) are optional.
 *
 * Unit conversions on submit:
 *   lbs → kg: multiply by 0.45359237
 *   height inches → cm: multiply by 2.54
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
} from 'react-native';
import { Dumbbell, Flame, TrendingDown, Activity } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { TextInput } from '@/components/TextInput';
import { Label } from '@/components/Label';
import { Toggle } from '@/components/Toggle';
import { Chip } from '@/components/Chip';
import { HelperText } from '@/components/HelperText';

export type Units = 'lbs' | 'kg';
export type PrimaryGoal = 'strength' | 'hypertrophy' | 'fat-loss' | 'general';
export type Sex = 'male' | 'female' | 'other';

export interface ProfileStepValues {
  displayName: string;
  units: Units;
  goal: PrimaryGoal;
  age: string;
  sex: Sex | null;
  height: string;
  weight: string;
  bodyFat: string;
}

interface ProfileStepProps {
  values: ProfileStepValues;
  onChange: (values: ProfileStepValues) => void;
  error?: string | null;
}

const UNIT_OPTIONS: [{ label: string; value: Units }, { label: string; value: Units }] = [
  { label: 'lbs', value: 'lbs' },
  { label: 'kg', value: 'kg' },
];

const GOAL_OPTIONS: {
  id: PrimaryGoal;
  label: string;
  icon: React.ReactNode;
}[] = [
  { id: 'strength', label: 'Strength', icon: <Dumbbell size={20} color="#F2CA50" /> },
  { id: 'hypertrophy', label: 'Hypertrophy', icon: <Flame size={20} color="#F2CA50" /> },
  { id: 'fat-loss', label: 'Fat Loss', icon: <TrendingDown size={20} color="#F2CA50" /> },
  { id: 'general', label: 'General Fitness', icon: <Activity size={20} color="#F2CA50" /> },
];

const SEX_OPTIONS: { id: Sex; label: string }[] = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
  { id: 'other', label: 'Other' },
];

/**
 * ProfileStep renders the display name, units toggle, goal chips, and
 * optional measurement fields (age, sex, height, weight, body fat %).
 *
 * The parent screen handles Supabase writes and navigation.
 * This component is purely controlled (values + onChange).
 */
export function ProfileStep({ values, onChange, error }: ProfileStepProps) {
  const update = (partial: Partial<ProfileStepValues>) =>
    onChange({ ...values, ...partial });

  const heightLabel = values.units === 'lbs' ? 'Height (in)' : 'Height (cm)';
  const heightPlaceholder = values.units === 'lbs' ? '70' : '178';
  const weightLabel = values.units === 'lbs' ? 'Weight (lbs)' : 'Weight (kg)';
  const weightPlaceholder = values.units === 'lbs' ? '175' : '80';

  return (
    <View className="gap-md">
      {/* Heading */}
      <Text
        className="text-fg"
        style={{ fontFamily: 'Noto Serif', fontSize: 24, fontWeight: '700' }}
        allowFontScaling={false}
      >
        Set up your profile
      </Text>

      {/* Display name */}
      <View className="gap-xs">
        <Label>Display name</Label>
        <TextInput
          variant="text"
          placeholder="What should we call you?"
          value={values.displayName}
          onChangeText={(t) => update({ displayName: t })}
          autoCapitalize="words"
          returnKeyType="done"
        />
      </View>

      {/* Preferred units */}
      <View className="gap-xs">
        <Label>Preferred units</Label>
        <Toggle
          options={UNIT_OPTIONS}
          value={values.units}
          onChange={(v) => update({ units: v })}
          haptics
        />
      </View>

      {/* Primary goal */}
      <View className="gap-xs">
        <Label>Primary goal</Label>
        <View className="flex-row flex-wrap gap-sm">
          {GOAL_OPTIONS.map((g) => (
            <View key={g.id} className="flex-1 min-w-[45%]">
              <Chip
                label={g.label}
                icon={g.icon}
                selected={values.goal === g.id}
                onPress={async () => {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  update({ goal: g.id });
                }}
                haptics={false}
              />
            </View>
          ))}
        </View>
      </View>

      {/* Age + Sex row */}
      <View className="flex-row gap-sm">
        {/* Age */}
        <View className="flex-1 gap-xs">
          <Label>Age</Label>
          <TextInput
            variant="text"
            keyboardType="number-pad"
            placeholder="25"
            value={values.age}
            onChangeText={(t) => update({ age: t })}
          />
        </View>

        {/* Sex */}
        <View className="flex-1 gap-xs">
          <Label>Sex</Label>
          <View className="flex-row gap-xs">
            {SEX_OPTIONS.map((s) => (
              <View key={s.id} className="flex-1">
                <Chip
                  label={s.label}
                  selected={values.sex === s.id}
                  onPress={async () => {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    update({ sex: s.id });
                  }}
                  haptics={false}
                />
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Height + Weight row */}
      <View className="flex-row gap-sm">
        {/* Height */}
        <View className="flex-1 gap-xs">
          <Label>{heightLabel}</Label>
          <TextInput
            variant="text"
            keyboardType="number-pad"
            placeholder={heightPlaceholder}
            value={values.height}
            onChangeText={(t) => update({ height: t })}
          />
        </View>

        {/* Weight */}
        <View className="flex-1 gap-xs">
          <Label>{weightLabel}</Label>
          <TextInput
            variant="text"
            keyboardType="number-pad"
            placeholder={weightPlaceholder}
            value={values.weight}
            onChangeText={(t) => update({ weight: t })}
          />
        </View>
      </View>

      {/* Body fat % (optional) */}
      <View className="gap-xs">
        <Label>Body fat %</Label>
        <TextInput
          variant="text"
          keyboardType="decimal-pad"
          placeholder="15"
          value={values.bodyFat}
          onChangeText={(t) => update({ bodyFat: t })}
        />
        <Text className="text-caption text-fg-muted" allowFontScaling={false}>
          (optional)
        </Text>
      </View>

      {/* Error message */}
      {error ? <HelperText variant="error">{error}</HelperText> : null}
    </View>
  );
}

/**
 * Convert height to cm based on units:
 *   lbs context → height is in inches → multiply by 2.54
 *   kg context → height already in cm
 */
export function heightToCm(height: string, units: Units): number | null {
  const val = parseFloat(height);
  if (isNaN(val) || val <= 0) return null;
  return units === 'lbs' ? val * 2.54 : val;
}

/**
 * Convert weight to kg based on units:
 *   lbs → multiply by 0.45359237
 *   kg → use as-is
 */
export function weightToKg(weight: string, units: Units): number | null {
  const val = parseFloat(weight);
  if (isNaN(val) || val <= 0) return null;
  return units === 'lbs' ? val * 0.45359237 : val;
}

export default ProfileStep;
