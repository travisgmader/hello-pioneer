/**
 * useOnboardingState — manages the onboarding completion flag.
 *
 * Primary storage: MMKV key "onboarding.complete" (string "true" | "false" | absent).
 * Secondary storage: Supabase profiles.onboarded (boolean, server-side).
 *
 * Reinstall guard (RESEARCH.md Pitfall 9):
 *   After a device reinstall, MMKV is wiped but the Supabase profile persists.
 *   On startup, if "onboarding.complete" is absent in MMKV but profiles.onboarded
 *   is true in Supabase, we write the MMKV flag so the user skips onboarding.
 *   Without this guard, every reinstall would send onboarded users back through
 *   the onboarding flow.
 *
 * Exports:
 *   useOnboardingState() → { onboardingComplete: boolean }
 *   setOnboardingComplete(value: boolean) → writes MMKV + Supabase
 *   updateOnboardingStep(step: number) → writes progress to MMKV for app-kill recovery
 */

import { useState, useEffect, useCallback } from 'react';
import { useMMKVString } from 'react-native-mmkv';
import { getStorage } from '@/lib/storage';
import { supabase } from '@/lib/supabase';

const ONBOARDING_COMPLETE_KEY = 'onboarding.complete';
const ONBOARDING_STEP_KEY = 'onboarding.step';

export function useOnboardingState(): { onboardingComplete: boolean } {
  const [rawFlag] = useMMKVString(ONBOARDING_COMPLETE_KEY);
  const [serverChecked, setServerChecked] = useState(false);
  const [serverOnboarded, setServerOnboarded] = useState(false);

  // On mount: if the MMKV flag is absent, query Supabase profiles.onboarded to
  // handle the reinstall scenario (RESEARCH.md Pitfall 9).
  useEffect(() => {
    if (rawFlag !== undefined) {
      // MMKV has a value — no need to check the server.
      setServerChecked(true);
      return;
    }

    let cancelled = false;

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!session || cancelled) return;

        return supabase
          .from('profiles')
          .select('onboarded')
          .eq('user_id', session.user.id)
          .single();
      })
      .then((result) => {
        if (!result || cancelled) return;
        const { data } = result;

        if (data && (data as { onboarded: boolean }).onboarded === true) {
          // Mirror Supabase → MMKV so future launches skip onboarding.
          getStorage().set(ONBOARDING_COMPLETE_KEY, 'true');
          setServerOnboarded(true);
        }
        setServerChecked(true);
      })
      .catch(() => {
        // Network error on offline launch — treat as not onboarded (flag absent).
        setServerChecked(true);
      });

    return () => {
      cancelled = true;
    };
  }, [rawFlag]);

  const onboardingComplete =
    rawFlag === 'true' || (serverChecked && serverOnboarded);

  return { onboardingComplete };
}

/**
 * Marks onboarding as complete. Writes both MMKV (for immediate routing) and
 * Supabase profiles.onboarded (so reinstall guard works on future launches).
 */
export async function setOnboardingComplete(value: boolean): Promise<void> {
  getStorage().set(ONBOARDING_COMPLETE_KEY, value ? 'true' : 'false');

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return;

  await supabase
    .from('profiles')
    .update({ onboarded: value })
    .eq('user_id', session.user.id);
}

/**
 * Persists the current onboarding step to MMKV so partial progress survives
 * an app kill between steps (CONTEXT.md Decision 2).
 */
export function updateOnboardingStep(step: number): void {
  getStorage().set(ONBOARDING_STEP_KEY, String(step));
}

/**
 * Reads the last persisted onboarding step. Returns 0 if none stored.
 */
export function getOnboardingStep(): number {
  const raw = getStorage().getString(ONBOARDING_STEP_KEY);
  return raw ? parseInt(raw, 10) : 0;
}
