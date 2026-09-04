/**
 * historyService — HISTORY-02 / HISTORY-03 (RED scaffold, Wave 0)
 *
 * `src/services/historyService.ts` ships in plan 03-03. This suite is written
 * first and is EXPECTED TO FAIL with a module-resolution error until it does.
 *
 * Contract this suite pins down (RESEARCH Pattern 3, PATTERNS "PowerSync write"):
 *   - Every history edit runs inside ONE ps.writeTransaction so the sessions
 *     row, the upserted session_sets and the deleted session_sets either all
 *     land or none do (HISTORY-02).
 *   - Set upserts use INSERT OR REPLACE keyed by the stable client-generated
 *     session_sets.id — the write is idempotent on retry.
 *   - Removed sets are DELETEd by id inside the same transaction.
 *   - rowsAffected is NEVER asserted on: the PowerSync JSON view returns 0 even
 *     on success (RESEARCH Pitfall 4).
 *   - Because reads are reactive usePowerSyncQuery subscriptions, no manual
 *     cache invalidation is issued — charts re-render for free (HISTORY-03).
 *
 * Mock style copied from tests/unit/sessionService.test.ts: self-contained
 * vi.mock factories (they are hoisted, so they may not reference outer vars).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── react-native mock ─────────────────────────────────────────────────────────
vi.mock('react-native', () => ({
  AppState: { currentState: 'active', addEventListener: () => ({ remove: () => {} }) },
  Platform: { OS: 'ios', select: (o: Record<string, unknown>) => o.ios ?? o.default },
  Alert: { alert: vi.fn() },
}));

// ── @/lib/powersync mock ──────────────────────────────────────────────────────
vi.mock('@/lib/powersync', () => {
  const mockTx = { execute: vi.fn().mockResolvedValue({}) };
  const mockWriteTransaction = vi.fn(async (cb: (tx: typeof mockTx) => Promise<void>) => {
    await cb(mockTx);
  });
  const mockPS = { writeTransaction: mockWriteTransaction, execute: vi.fn().mockResolvedValue({}) };
  return {
    getPowerSync: vi.fn(() => mockPS),
    powersync: mockPS,
    __mockPS: mockPS,
    __mockTx: mockTx,
  };
});

// ── expo-crypto mock ──────────────────────────────────────────────────────────
vi.mock('expo-crypto', () => ({
  randomUUID: vi.fn(() => '00000000-0000-4000-8000-000000000001'),
}));

import * as powersyncModule from '@/lib/powersync';
import { updateSessionHistory } from '@/services/historyService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mocks = powersyncModule as any;

const SESSION_ID = '11111111-1111-4111-8111-111111111111';
const SET_A = '22222222-2222-4222-8222-222222222222';
const SET_B = '33333333-3333-4333-8333-333333333333';

const sql = (call: unknown[]) => String(call[0]).replace(/\s+/g, ' ').trim().toUpperCase();

beforeEach(() => {
  vi.clearAllMocks();
});

describe('updateSessionHistory — atomicity', () => {
  it('wraps every statement in a single writeTransaction', async () => {
    await updateSessionHistory({
      sessionId: SESSION_ID,
      notes: 'felt strong',
      updatedSets: [
        { id: SET_A, exerciseId: 'ex-1', setNumber: 1, weightKg: 100, repsTarget: 5, result: 'go', isWarmup: false },
      ],
      removedSetIds: [],
    });

    expect(mocks.__mockPS.writeTransaction).toHaveBeenCalledTimes(1);
    // No statement may be issued outside the transaction.
    expect(mocks.__mockPS.execute).not.toHaveBeenCalled();
  });

  it('updates the sessions row and upserts each edited set in the same transaction', async () => {
    await updateSessionHistory({
      sessionId: SESSION_ID,
      notes: 'felt strong',
      updatedSets: [
        { id: SET_A, exerciseId: 'ex-1', setNumber: 1, weightKg: 100, repsTarget: 5, result: 'go', isWarmup: false },
        { id: SET_B, exerciseId: 'ex-1', setNumber: 2, weightKg: 105, repsTarget: 5, result: 'no-go', isWarmup: false },
      ],
      removedSetIds: [],
    });

    const statements = mocks.__mockTx.execute.mock.calls.map(sql);
    expect(statements.some((s: string) => s.includes('UPDATE SESSIONS'))).toBe(true);
    expect(
      statements.filter((s: string) => s.includes('INSERT OR REPLACE INTO SESSION_SETS')),
    ).toHaveLength(2);
  });

  it('deletes removed sets by id inside the same transaction', async () => {
    await updateSessionHistory({
      sessionId: SESSION_ID,
      notes: null,
      updatedSets: [],
      removedSetIds: [SET_B],
    });

    const deletes = mocks.__mockTx.execute.mock.calls.filter((c: unknown[]) =>
      sql(c).includes('DELETE FROM SESSION_SETS'),
    );
    expect(deletes).toHaveLength(1);
    expect(deletes[0][1]).toContain(SET_B);
  });

  it('is idempotent — replaying the same edit issues the same INSERT OR REPLACE', async () => {
    const opts = {
      sessionId: SESSION_ID,
      notes: null,
      updatedSets: [
        { id: SET_A, exerciseId: 'ex-1', setNumber: 1, weightKg: 100, repsTarget: 5, result: 'go' as const, isWarmup: false },
      ],
      removedSetIds: [],
    };

    await updateSessionHistory(opts);
    const first = mocks.__mockTx.execute.mock.calls.map(sql);
    vi.clearAllMocks();
    await updateSessionHistory(opts);
    const second = mocks.__mockTx.execute.mock.calls.map(sql);

    expect(second).toEqual(first);
  });

  it('never inspects rowsAffected (PowerSync returns 0 on success)', async () => {
    await expect(
      updateSessionHistory({
        sessionId: SESSION_ID,
        notes: null,
        updatedSets: [],
        removedSetIds: [],
      }),
    ).resolves.not.toThrow();
  });
});
