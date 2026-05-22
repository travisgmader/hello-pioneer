import { describe, it, expect } from 'vitest';
import { shouldShowOverloadHint, SetRowWithWeight } from '../../src/lib/progressiveOverload';

describe('shouldShowOverloadHint', () => {
  it('shows hint when previous session completed all working sets at current weight', () => {
    const sets: SetRowWithWeight[] = [
      { result: 'go', is_warmup: false, weight_kg: 100 },
      { result: 'go', is_warmup: false, weight_kg: 100 },
      { result: 'go', is_warmup: false, weight_kg: 100 },
    ];
    expect(shouldShowOverloadHint(sets, 100)).toBe(true);
  });

  it('hides hint when previous session had any no-go at current weight', () => {
    const sets: SetRowWithWeight[] = [
      { result: 'go', is_warmup: false, weight_kg: 100 },
      { result: 'no-go', is_warmup: false, weight_kg: 100 },
      { result: 'go', is_warmup: false, weight_kg: 100 },
    ];
    expect(shouldShowOverloadHint(sets, 100)).toBe(false);
  });

  it('hides hint when no previous session exists', () => {
    expect(shouldShowOverloadHint([], 100)).toBe(false);
  });

  it('hides hint when no working sets at current weight (weight changed)', () => {
    const sets: SetRowWithWeight[] = [
      { result: 'go', is_warmup: false, weight_kg: 95 },
      { result: 'go', is_warmup: false, weight_kg: 95 },
    ];
    // Current weight is 100, previous was 95 — no match
    expect(shouldShowOverloadHint(sets, 100)).toBe(false);
  });

  it('ignores warm-up sets entirely — all working sets are go, warm-up is no-go', () => {
    const sets: SetRowWithWeight[] = [
      { result: 'no-go', is_warmup: true, weight_kg: 100 },  // warm-up, should be ignored
      { result: 'go', is_warmup: false, weight_kg: 100 },
      { result: 'go', is_warmup: false, weight_kg: 100 },
    ];
    // Warm-up no-go should not affect result — working sets are all 'go'
    expect(shouldShowOverloadHint(sets, 100)).toBe(true);
  });

  it('ignores null-result sets (incomplete sets do not affect the decision)', () => {
    const sets: SetRowWithWeight[] = [
      { result: 'go', is_warmup: false, weight_kg: 100 },
      { result: null, is_warmup: false, weight_kg: 100 },  // incomplete — excluded
    ];
    // Only 1 completed working set at 100kg, and it's 'go' — should show hint
    expect(shouldShowOverloadHint(sets, 100)).toBe(true);
  });

  it('returns false when all sets at current weight are null-result (no completed signal)', () => {
    const sets: SetRowWithWeight[] = [
      { result: null, is_warmup: false, weight_kg: 100 },
      { result: null, is_warmup: false, weight_kg: 100 },
    ];
    expect(shouldShowOverloadHint(sets, 100)).toBe(false);
  });

  it('uses exact weight equality — different weights in the same session do not mix', () => {
    const sets: SetRowWithWeight[] = [
      { result: 'go', is_warmup: false, weight_kg: 95 },
      { result: 'go', is_warmup: false, weight_kg: 100 },
      { result: 'go', is_warmup: false, weight_kg: 105 },
    ];
    expect(shouldShowOverloadHint(sets, 100)).toBe(true);
    expect(shouldShowOverloadHint(sets, 95)).toBe(true);
    expect(shouldShowOverloadHint(sets, 90)).toBe(false);
  });

  it('returns false when previousSets is empty array', () => {
    expect(shouldShowOverloadHint([], 80)).toBe(false);
  });
});
