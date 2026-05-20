/**
 * Allowlist gate unit tests — ARCH-01 multi-tenant gate (browser side).
 *
 * Asserts isAllowedEmail's contract per PLAN.md Task 3.1 behavior:
 *   - lowercases the input before the `eq()` query
 *   - trims surrounding whitespace before the `eq()` query
 *   - returns true when the DB returns a row, false when null
 *
 * The supabase client is mocked at the module boundary so this test never
 * touches the network. We capture the argument passed to `.eq()` to verify
 * the case-insensitive + trim coercion happens client-side.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Spy on the eq() argument so each test can assert what was queried.
const eqSpy = vi.fn();

// Build a chainable thenable that matches the supabase-js select().eq().maybeSingle() shape.
// `maybeSingleResult` is mutated per-test to control whether a row "exists".
let maybeSingleResult: { data: { email: string } | null; error: null } = {
  data: null,
  error: null,
};

vi.mock('../../src/data/supabase', () => {
  return {
    supabase: {
      from: vi.fn().mockImplementation(() => ({
        select: vi.fn().mockImplementation(() => ({
          eq: (column: string, value: string) => {
            eqSpy(column, value);
            return {
              maybeSingle: () => Promise.resolve(maybeSingleResult),
            };
          },
        })),
      })),
    },
  };
});

import { isAllowedEmail } from '../../src/auth/allowlist';

describe('isAllowedEmail', () => {
  beforeEach(() => {
    eqSpy.mockClear();
    maybeSingleResult = { data: null, error: null };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns true for an allowlisted email and lowercases the input', async () => {
    maybeSingleResult = { data: { email: 'travis.g.mader@gmail.com' }, error: null };

    const result = await isAllowedEmail('travis.g.mader@gmail.com');

    expect(result).toBe(true);
    expect(eqSpy).toHaveBeenCalledWith('email', 'travis.g.mader@gmail.com');
  });

  it('lowercases an UPPER@CASE.COM input before the query', async () => {
    maybeSingleResult = { data: null, error: null };

    const result = await isAllowedEmail('UPPER@CASE.COM');

    expect(result).toBe(false);
    expect(eqSpy).toHaveBeenCalledWith('email', 'upper@case.com');
  });

  it('trims surrounding whitespace before the query', async () => {
    maybeSingleResult = { data: null, error: null };

    const result = await isAllowedEmail('  trim@me.com  ');

    expect(result).toBe(false);
    expect(eqSpy).toHaveBeenCalledWith('email', 'trim@me.com');
  });
});
