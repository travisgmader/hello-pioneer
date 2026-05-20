/**
 * MigrationProgress — full-screen migration status UI.
 *
 * Renders one of three states based on the `status` prop:
 *
 *   pending | in_progress:
 *     Heading "Bringing your history forward" + body copy + Spinner.
 *     No action buttons — user waits.
 *
 *   complete:
 *     CheckCircle2 icon (success green) + heading "All set" + body copy.
 *     Auto-navigation is handled by the parent screen (app/migration.tsx).
 *
 *   failed:
 *     AlertTriangle icon (danger red) + heading "Something went wrong" + body copy.
 *     Primary "Retry" button → calls onRetry.
 *     Ghost "Contact support" button → opens mailto link.
 *
 * Props:
 *   status   — current MigrationStatus driving which state is rendered
 *   onRetry  — called when user taps the Retry button in the failed state
 */

import { SafeAreaView, View, Text, Linking } from 'react-native';
import { CheckCircle2, AlertTriangle } from 'lucide-react-native';
import { Spinner } from '@/components/Spinner';
import { Button } from '@/components/Button';
import type { MigrationStatus } from '@/services/migration';

interface Props {
  status: MigrationStatus;
  onRetry: () => void;
}

export default function MigrationProgress({ status, onRetry }: Props) {
  const isInProgress = status === 'in_progress' || status === 'pending';
  const isComplete = status === 'complete';
  // failed (or any unexpected value) falls through to the failed state

  return (
    <SafeAreaView className="flex-1 bg-bg items-center justify-center px-md">
      {isInProgress ? (
        <>
          <Text className="font-display text-2xl text-fg text-center">
            Bringing your history forward
          </Text>
          <View className="h-lg" />
          <Text className="font-body text-base text-fg-muted text-center">
            We're moving your v1 workouts into the new app. Hang tight.
          </Text>
          <View className="h-lg" />
          <Spinner size="large" />
        </>
      ) : isComplete ? (
        <>
          <CheckCircle2 size={32} color="#22C55E" />
          <View className="h-md" />
          <Text className="font-display text-2xl text-fg text-center">
            All set
          </Text>
          <View className="h-sm" />
          <Text className="font-body text-base text-fg-muted text-center">
            Your history is ready.
          </Text>
        </>
      ) : (
        <>
          <AlertTriangle size={32} color="#EF4444" />
          <View className="h-md" />
          <Text className="font-display text-2xl text-fg text-center">
            Something went wrong
          </Text>
          <View className="h-sm" />
          <Text className="font-body text-base text-fg-muted text-center">
            We couldn't import your data. You can try again — your old workouts
            are safe.
          </Text>
          <View className="h-xl" />
          <Button variant="primary" label="Retry" onPress={onRetry} />
          <View className="h-md" />
          <Button
            variant="ghost"
            label="Contact support"
            onPress={() =>
              Linking.openURL('mailto:support@razeandrise.app')
            }
          />
        </>
      )}
    </SafeAreaView>
  );
}
