/**
 * Onboarding step 3: Starter template picker.
 *
 * Reads MMKV onboarding.splitType, filters starter-templates.json,
 * displays matching template days as selectable cards.
 *
 * On Continue:
 *   1. Looks up exercise IDs from Supabase exercises table (by name)
 *   2. Inserts a templates row
 *   3. Inserts template_exercises rows
 *   4. Stores template UUID in MMKV
 */

import { useState } from 'react';
import { View, Text } from 'react-native';
import { router } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { supabase } from '@/lib/supabase';
import { getStorage } from '@/lib/storage';
import { OnboardingStepLayout } from '@/components/OnboardingStepLayout';
import { TemplateBuilder, type TemplateDay } from '@/components/TemplateBuilder';
import starterTemplates from '../../supabase/starter-templates.json';

type StarterTemplates = typeof starterTemplates;
type SplitKey = keyof StarterTemplates;

function getTemplateData(splitType: string | undefined): {
  label: string;
  days: TemplateDay[];
} | null {
  if (!splitType || !(splitType in starterTemplates)) return null;
  const key = splitType as SplitKey;
  return starterTemplates[key] as { label: string; days: TemplateDay[] };
}

export default function OnboardingTemplateScreen() {
  const storage = getStorage();
  const splitType = storage.getString('onboarding.splitType');
  const templateData = getTemplateData(splitType);

  const [selectedDayLabel, setSelectedDayLabel] = useState<string | null>(
    // Default to first day if available
    templateData?.days[0]?.day_label ?? null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const continueEnabled = selectedDayLabel !== null;

  const handleBack = () => {
    router.back();
  };

  const handleContinue = async () => {
    if (!selectedDayLabel || !templateData) return;
    setLoading(true);
    setError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError('Session expired. Please sign in again.');
        setLoading(false);
        return;
      }

      const userId = session.user.id;
      const selectedDay = templateData.days.find(
        (d) => d.day_label === selectedDayLabel
      );

      if (!selectedDay) {
        setError('Invalid template selection. Please try again.');
        setLoading(false);
        return;
      }

      const exerciseNames = selectedDay.exercises;

      // Look up exercise IDs by name from the exercises table
      const { data: exerciseRows, error: exError } = await supabase
        .from('exercises')
        .select('id, name')
        .in('name', exerciseNames);

      if (exError) {
        setError(exError.message || 'Failed to load exercises. Please try again.');
        setLoading(false);
        return;
      }

      const templateId = Crypto.randomUUID();
      const templateName = `${templateData.label} - ${selectedDay.day_label}`;

      // Insert templates row
      const { error: templateError } = await supabase.from('templates').insert({
        id: templateId,
        user_id: userId,
        day_label: selectedDay.day_label,
        name: templateName,
      });

      if (templateError) {
        setError(templateError.message || 'Failed to create template. Please try again.');
        setLoading(false);
        return;
      }

      // Build template_exercises rows using found exercise IDs
      // Match exercises in the original order from starter-templates.json
      const exerciseMap = new Map<string, string>(
        (exerciseRows ?? []).map((e: { id: string; name: string }) => [e.name, e.id])
      );

      const templateExercises = exerciseNames
        .filter((name) => exerciseMap.has(name))
        .map((name, i) => ({
          id: Crypto.randomUUID(),
          template_id: templateId,
          exercise_id: exerciseMap.get(name)!,
          position: i,
          sets: 3,
        }));

      if (templateExercises.length > 0) {
        const { error: texError } = await supabase
          .from('template_exercises')
          .insert(templateExercises);

        if (texError) {
          console.warn('[OnboardingTemplate] template_exercises insert failed:', texError.message);
        }
      }

      // Store template UUID in MMKV
      storage.set('onboarding.selectedTemplateId', templateId);

      router.push('/(onboarding)/practice-set');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!templateData) {
    return (
      <OnboardingStepLayout
        step={3}
        onBack={handleBack}
        onContinue={handleContinue}
        continueEnabled={false}
        loading={false}
      >
        <View className="gap-sm">
          <Text
            className="text-fg"
            style={{ fontFamily: 'Noto Serif', fontSize: 24, fontWeight: '700' }}
            allowFontScaling={false}
          >
            Pick a starter template
          </Text>
          <Text className="text-body text-danger" allowFontScaling={false}>
            No split selected. Please go back and choose a split.
          </Text>
        </View>
      </OnboardingStepLayout>
    );
  }

  return (
    <OnboardingStepLayout
      step={3}
      onBack={handleBack}
      onContinue={handleContinue}
      continueEnabled={continueEnabled}
      loading={loading}
    >
      <View className="gap-sm">
        <Text
          className="text-fg"
          style={{ fontFamily: 'Noto Serif', fontSize: 24, fontWeight: '700' }}
          allowFontScaling={false}
        >
          Pick a starter template
        </Text>
        <Text
          className="text-body text-fg-muted"
          allowFontScaling={false}
        >
          You can fully customize this later in the Split tab.
        </Text>

        {error ? (
          <Text className="text-caption text-danger" allowFontScaling={false}>
            {error}
          </Text>
        ) : null}
      </View>

      <View className="mt-lg">
        <TemplateBuilder
          days={templateData.days}
          selectedDayLabel={selectedDayLabel}
          onSelectDay={setSelectedDayLabel}
        />
      </View>
    </OnboardingStepLayout>
  );
}
