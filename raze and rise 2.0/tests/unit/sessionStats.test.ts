import { describe, it, expect } from 'vitest';
import { computeGoRate, computeWorkingSetCount } from '@/lib/sessionStats';

describe('computeGoRate', () => {
  it('returns 0 for an empty array', () => {
    expect(computeGoRate([])).toBe(0);
  });

  it('returns 100 when all working sets are go', () => {
    const sets = [
      { result: 'go' as const, is_warmup: false },
      { result: 'go' as const, is_warmup: false },
      { result: 'go' as const, is_warmup: false },
    ];
    expect(computeGoRate(sets)).toBe(100);
  });

  it('returns correct rate for mixed go/no-go working sets', () => {
    const sets = [
      { result: 'go' as const, is_warmup: false },
      { result: 'go' as const, is_warmup: false },
      { result: 'no-go' as const, is_warmup: false },
    ];
    // 2 / 3 = 66.67
    expect(computeGoRate(sets)).toBe(66.67);
  });

  it('excludes warmup sets from BOTH numerator and denominator', () => {
    const sets = [
      { result: 'go' as const, is_warmup: false },
      { result: 'go' as const, is_warmup: false },
      { result: 'go' as const, is_warmup: false },
      { result: 'go' as const, is_warmup: true },
      { result: 'go' as const, is_warmup: true },
    ];
    // 3 working go / 3 working total = 100
    expect(computeGoRate(sets)).toBe(100);
  });

  it('excludes warmup sets from denominator — mixed working sets with warmup go sets', () => {
    const sets = [
      { result: 'go' as const, is_warmup: false },
      { result: 'no-go' as const, is_warmup: false },
      { result: 'go' as const, is_warmup: true },
      { result: 'go' as const, is_warmup: true },
      { result: 'go' as const, is_warmup: true },
    ];
    // 1 working go / 2 working total = 50
    expect(computeGoRate(sets)).toBe(50);
  });

  it('returns 0 when all sets are warmup sets', () => {
    const sets = [
      { result: 'go' as const, is_warmup: true },
      { result: 'go' as const, is_warmup: true },
    ];
    expect(computeGoRate(sets)).toBe(0);
  });

  it('excludes null-result sets from the denominator (incomplete sets)', () => {
    const sets = [
      { result: 'go' as const, is_warmup: false },
      { result: null, is_warmup: false },
      { result: null, is_warmup: false },
    ];
    // only 1 completed working set, and it's go → 100%
    expect(computeGoRate(sets)).toBe(100);
  });

  it('returns 0 when all working sets have null result', () => {
    const sets = [
      { result: null, is_warmup: false },
      { result: null, is_warmup: false },
    ];
    expect(computeGoRate(sets)).toBe(0);
  });
});

describe('computeWorkingSetCount', () => {
  it('returns count of non-warmup sets', () => {
    const sets = [
      { result: 'go' as const, is_warmup: false },
      { result: 'go' as const, is_warmup: false },
      { result: 'go' as const, is_warmup: true },
    ];
    expect(computeWorkingSetCount(sets)).toBe(2);
  });

  it('returns 0 for an empty array', () => {
    expect(computeWorkingSetCount([])).toBe(0);
  });

  it('returns 0 when all sets are warmup sets', () => {
    const sets = [
      { result: 'go' as const, is_warmup: true },
      { result: 'go' as const, is_warmup: true },
    ];
    expect(computeWorkingSetCount(sets)).toBe(0);
  });
});
