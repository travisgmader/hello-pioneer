import { useState, useCallback } from 'react';
import * as Haptics from 'expo-haptics';

/**
 * SetResult — the three possible states of a logged set.
 * null = not yet logged; 'go' = successful rep; 'no-go' = failed/skipped rep.
 */
export type SetResult = null | 'go' | 'no-go';

interface UseSetResultReturn {
  result: SetResult;
  handleGo: () => Promise<void>;
  handleNoGo: () => Promise<void>;
  reset: () => void;
}

/**
 * useSetResult — state machine for a single set's go/no-go result.
 *
 * Extracted verbatim from PracticeSetCard (lines 25–33) to make the state machine
 * reusable across SetRow, PracticeSetCard, and any future set-logging surface.
 *
 * Toggle semantics:
 *   - handleGo():   null → 'go';   'go' → null;   'no-go' → 'go'
 *   - handleNoGo(): null → 'no-go'; 'no-go' → null; 'go' → 'no-go'
 *   - reset():      any state → null
 *
 * @param initial - Seed value for the state; defaults to null.
 *   IMPORTANT: Pass the persisted value from the Zustand store when used inside a
 *   FlashList item — FlashList recycles components and local useState default does
 *   NOT survive a recycle. The parent (SetRow) must provide `initial` from the store
 *   so the hook rehydrates correctly on recycle (RESEARCH.md Pitfall 1).
 */
export function useSetResult(initial: SetResult = null): UseSetResultReturn {
  const [result, setResult] = useState<SetResult>(initial);

  const handleGo = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setResult((prev) => (prev === 'go' ? null : 'go'));
  }, []);

  const handleNoGo = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setResult((prev) => (prev === 'no-go' ? null : 'no-go'));
  }, []);

  const reset = useCallback(() => setResult(null), []);

  return { result, handleGo, handleNoGo, reset };
}
