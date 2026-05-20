/**
 * Wave 0 RED stub — ARCH-03 (TanStack Query at root) + ARCH-09 (paused mutations).
 *
 * The queryClient module is created in Plan 04. Until then this test MUST
 * fail at import time. Asserts the offline-first mutation networkMode that
 * powers the in-memory offline queue (CLAUDE.md §TanStack Query v5 Patterns).
 */
import { describe, it, expect } from 'vitest';
// @ts-expect-error — module is created in Plan 04
import { queryClient } from '../../src/data/queryClient';

describe('queryClient (Wave 0 RED stub — created in Plan 04)', () => {
  it('has offlineFirst mutations and online queries by default', () => {
    const defaults = queryClient.getDefaultOptions();
    expect(defaults.mutations?.networkMode).toBe('offlineFirst');
    expect(defaults.queries?.networkMode).toBe('online');
  });
});
