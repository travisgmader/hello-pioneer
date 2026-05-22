import { describe, it, expect } from 'vitest';
import {
  supersetRoundComplete,
  nextSupersetTarget,
  buildFlashListData,
  findFlashListIndexForExercise,
  SetRowState,
  FlashListItem,
} from '@/lib/supersetLogic';

// ── supersetRoundComplete ─────────────────────────────────────────────────────

describe('supersetRoundComplete', () => {
  it('round not complete when only A marked', () => {
    const setsA: SetRowState[] = [{ setNumber: 1, result: 'go' }];
    const setsB: SetRowState[] = [{ setNumber: 1, result: null }];
    expect(supersetRoundComplete(setsA, setsB, 1)).toBe(false);
  });

  it('round not complete when only B marked', () => {
    const setsA: SetRowState[] = [{ setNumber: 1, result: null }];
    const setsB: SetRowState[] = [{ setNumber: 1, result: 'go' }];
    expect(supersetRoundComplete(setsA, setsB, 1)).toBe(false);
  });

  it('round complete when both A and B marked at same set_number', () => {
    const setsA: SetRowState[] = [{ setNumber: 1, result: 'go' }];
    const setsB: SetRowState[] = [{ setNumber: 1, result: 'no-go' }];
    expect(supersetRoundComplete(setsA, setsB, 1)).toBe(true);
  });

  it('round complete regardless of result type (both go)', () => {
    const setsA: SetRowState[] = [{ setNumber: 1, result: 'go' }];
    const setsB: SetRowState[] = [{ setNumber: 1, result: 'go' }];
    expect(supersetRoundComplete(setsA, setsB, 1)).toBe(true);
  });

  it('round not complete when set numbers do not match (A has set 1, B has set 2)', () => {
    const setsA: SetRowState[] = [{ setNumber: 1, result: 'go' }];
    const setsB: SetRowState[] = [{ setNumber: 2, result: 'go' }];
    // Looking for setNumber=1: A has it with result, B does NOT have it at all
    expect(supersetRoundComplete(setsA, setsB, 1)).toBe(false);
  });

  it('returns false when both results are null', () => {
    const setsA: SetRowState[] = [{ setNumber: 1, result: null }];
    const setsB: SetRowState[] = [{ setNumber: 1, result: null }];
    expect(supersetRoundComplete(setsA, setsB, 1)).toBe(false);
  });
});

// ── nextSupersetTarget ────────────────────────────────────────────────────────

describe('nextSupersetTarget', () => {
  const emptySets: SetRowState[] = [];

  it('from A: always returns B at same set_number', () => {
    const setsA: SetRowState[] = [{ setNumber: 1, result: 'go' }];
    const target = nextSupersetTarget('A', 1, setsA, emptySets, 3);
    expect(target).toEqual({ exerciseLetter: 'B', setNumber: 1 });
  });

  it('from B, round complete, not last set: returns A at next set_number', () => {
    const setsA: SetRowState[] = [{ setNumber: 1, result: 'go' }];
    const setsB: SetRowState[] = [{ setNumber: 1, result: 'no-go' }];
    const target = nextSupersetTarget('B', 1, setsA, setsB, 3);
    expect(target).toEqual({ exerciseLetter: 'A', setNumber: 2 });
  });

  it('from B, round complete, last set: returns null (superset finished)', () => {
    const setsA: SetRowState[] = [{ setNumber: 3, result: 'go' }];
    const setsB: SetRowState[] = [{ setNumber: 3, result: 'go' }];
    const target = nextSupersetTarget('B', 3, setsA, setsB, 3);
    expect(target).toBeNull();
  });

  it('from B, round NOT complete: returns A at same set_number (wait for A)', () => {
    // B just completed set 1, but A has not yet completed set 1
    const setsA: SetRowState[] = [{ setNumber: 1, result: null }];
    const setsB: SetRowState[] = [{ setNumber: 1, result: 'go' }];
    const target = nextSupersetTarget('B', 1, setsA, setsB, 3);
    // Round NOT complete (A is null), so go back to A same set
    expect(target).toEqual({ exerciseLetter: 'A', setNumber: 1 });
  });
});

// ── buildFlashListData ────────────────────────────────────────────────────────

describe('buildFlashListData', () => {
  it('renders single exercises as type="single"', () => {
    const exercises = [
      { id: 'ex1', supersetGroup: null },
      { id: 'ex2', supersetGroup: null },
    ];
    const data = buildFlashListData(exercises);
    expect(data).toHaveLength(2);
    expect(data[0]).toMatchObject({ type: 'single', exerciseId: 'ex1' });
    expect(data[1]).toMatchObject({ type: 'single', exerciseId: 'ex2' });
  });

  it('deduplicates superset pairs so each group appears exactly once', () => {
    const exercises = [
      { id: 'exA', supersetGroup: 1 },
      { id: 'exB', supersetGroup: 1 },
    ];
    const data = buildFlashListData(exercises);
    expect(data).toHaveLength(1);
    expect(data[0]).toMatchObject({
      type: 'superset-pair',
      exerciseAId: 'exA',
      exerciseBId: 'exB',
      groupId: 1,
    });
  });

  it('renders mixed list with single + superset-pair', () => {
    const exercises = [
      { id: 'exX', supersetGroup: null },
      { id: 'exA', supersetGroup: 1 },
      { id: 'exB', supersetGroup: 1 },
      { id: 'exY', supersetGroup: null },
    ];
    const data = buildFlashListData(exercises);
    expect(data).toHaveLength(3);
    expect(data[0]).toMatchObject({ type: 'single', exerciseId: 'exX' });
    expect(data[1]).toMatchObject({ type: 'superset-pair' });
    expect(data[2]).toMatchObject({ type: 'single', exerciseId: 'exY' });
  });

  it('renders an orphan superset exercise as single', () => {
    const exercises = [{ id: 'exA', supersetGroup: 1 }];
    const data = buildFlashListData(exercises);
    expect(data).toHaveLength(1);
    expect(data[0]).toMatchObject({ type: 'single', exerciseId: 'exA' });
  });
});

// ── findFlashListIndexForExercise ─────────────────────────────────────────────

describe('findFlashListIndexForExercise', () => {
  it('resolves a single exercise id to its index', () => {
    const data: FlashListItem[] = [
      { type: 'single', exerciseId: 'exX' },
      { type: 'superset-pair', exerciseAId: 'exA', exerciseBId: 'exB', groupId: 1 },
      { type: 'single', exerciseId: 'exY' },
    ];
    expect(findFlashListIndexForExercise(data, 'exX')).toBe(0);
    expect(findFlashListIndexForExercise(data, 'exY')).toBe(2);
  });

  it('resolves exerciseB id to the superset-pair item index (Pitfall 8)', () => {
    const data: FlashListItem[] = [
      { type: 'single', exerciseId: 'exX' },
      { type: 'superset-pair', exerciseAId: 'exA', exerciseBId: 'exB', groupId: 1 },
      { type: 'single', exerciseId: 'exY' },
    ];
    // Both A and B should resolve to index 1 (the pair container)
    expect(findFlashListIndexForExercise(data, 'exA')).toBe(1);
    expect(findFlashListIndexForExercise(data, 'exB')).toBe(1);
  });

  it('returns -1 for unknown exerciseId (T-02-09 defense)', () => {
    const data: FlashListItem[] = [
      { type: 'single', exerciseId: 'exX' },
    ];
    expect(findFlashListIndexForExercise(data, 'unknown')).toBe(-1);
  });
});
