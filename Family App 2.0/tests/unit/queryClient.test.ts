/**
 * ARCH-03 (TanStack Query at root) + ARCH-09 (paused mutations).
 *
 * Asserts the offline-first mutation networkMode that powers the in-memory
 * offline queue (CLAUDE.md §TanStack Query v5 Patterns).
 *
 * GREEN transition: the queryClient module landed in Plan 04 (01-04a).
 */
import { describe, it, expect } from 'vitest';
import { queryClient } from '../../src/data/queryClient';

describe('queryClient', () => {
  it('has offlineFirst mutations and online queries by default', () => {
    const defaults = queryClient.getDefaultOptions();
    expect(defaults.mutations?.networkMode).toBe('offlineFirst');
    expect(defaults.queries?.networkMode).toBe('online');
  });
});
