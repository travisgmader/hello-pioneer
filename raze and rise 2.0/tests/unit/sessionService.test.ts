/**
 * sessionService tests — WORKOUT-17
 *
 * Tests run in a node/vitest environment without a React renderer.
 * Focuses on completeSession: writeTransaction wrapping sessions upsert +
 * split_settings rotation_pointer increment, and MMKV cleanup.
 *
 * Mocks:
 *   - react-native-mmkv: inline Map-based mock factory (avoids native nitro-modules chain)
 *   - react-native: AppState + Platform stub (avoids Flow-typed source parse errors)
 *   - @/lib/powersync: mock getPowerSync with writeTransaction spy
 *   - expo-crypto: mock randomUUID
 *   - @/stores/sessionStore: minimal stub
 *   - @/hooks/useSetResult: minimal stub
 *
 * Note on vi.mock hoisting: vi.mock factories are hoisted to the top of the file.
 * All mock factories below are completely self-contained (no external variable refs).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── react-native mock ─────────────────────────────────────────────────────────
// Full stub — avoids Flow-typed source that rolldown cannot parse.

vi.mock('react-native', () => ({
  AppState: {
    currentState: 'active',
    addEventListener: () => ({ remove: () => {} }),
  },
  Platform: {
    OS: 'ios',
    select(o: Record<string, unknown>) { return o.ios ?? o.default; },
  },
  Alert: { alert: vi.fn() },
  BackHandler: { addEventListener: vi.fn(), removeEventListener: vi.fn() },
}));

// ── react-native-mmkv mock ────────────────────────────────────────────────────
// Self-contained Map-based factory. Exposes __store via module-level for assertions.

vi.mock('react-native-mmkv', () => {
  // Module-scoped store and spy-able mock object
  const store = new Map<string, string>();
  const mockMMKV = {
    set: (key: string, value: string) => { store.set(key, value); },
    getString: (key: string) => store.get(key),
    remove: (key: string) => { store.delete(key); return true; },
    contains: (key: string) => store.has(key),
    getAllKeys: () => [...store.keys()],
    clearAll: () => { store.clear(); },
    addOnValueChangedListener: () => ({ remove: () => {} }),
    __store: store,
  };
  return {
    createMMKV: () => mockMMKV,
    useMMKVString: () => [undefined, () => {}],
    __mockMMKV: mockMMKV,
    __store: store,
  };
});

// ── @/lib/powersync mock ──────────────────────────────────────────────────────
// Mock getPowerSync to return a fake PowerSync with a writeTransaction spy.

vi.mock('@/lib/powersync', () => {
  const mockTx = {
    execute: vi.fn().mockResolvedValue({}),
  };
  const mockWriteTransaction = vi.fn(async (cb: (tx: typeof mockTx) => Promise<void>) => {
    await cb(mockTx);
  });
  const mockPS = {
    writeTransaction: mockWriteTransaction,
    __mockTx: mockTx,
  };
  return {
    getPowerSync: vi.fn(() => mockPS),
    powersync: mockPS,
    __mockPS: mockPS,
    __mockTx: mockTx,
    __mockWriteTransaction: mockWriteTransaction,
  };
});

// ── expo-crypto mock ──────────────────────────────────────────────────────────

vi.mock('expo-crypto', () => ({
  randomUUID: vi.fn(() => 'mock-crypto-uuid-12345'),
}));

// ── @/stores/sessionStore mock ────────────────────────────────────────────────

vi.mock('@/stores/sessionStore', () => ({
  useSessionStore: vi.fn(),
}));

// ── @/hooks/useSetResult mock ─────────────────────────────────────────────────

vi.mock('@/hooks/useSetResult', () => ({
  useSetResult: vi.fn(),
}));

// ── Post-mock imports ─────────────────────────────────────────────────────────

import { completeSession, CompleteSessionArgs } from '@/services/sessionService';
import * as powersyncMod from '@/lib/powersync';
import * as mmkvMod from 'react-native-mmkv';

// ── Typed access to mock internals ────────────────────────────────────────────

type MockPS = {
  writeTransaction: ReturnType<typeof vi.fn>;
  __mockTx: { execute: ReturnType<typeof vi.fn> };
};

type MockMMKVMod = {
  __mockMMKV: {
    remove: (key: string) => boolean;
    set: (key: string, value: string) => void;
    clearAll: () => void;
    __store: Map<string, string>;
    [key: string]: unknown;
  };
  __store: Map<string, string>;
};

type MockPSMod = {
  __mockPS: MockPS;
  __mockTx: { execute: ReturnType<typeof vi.fn> };
  __mockWriteTransaction: ReturnType<typeof vi.fn>;
};

// ── Test fixtures ─────────────────────────────────────────────────────────────

const baseArgs: CompleteSessionArgs = {
  sessionId: 'test-session-uuid-1234',
  userId: 'user-abc-9876',
  templateId: 'template-push-day',
  dayLabel: 'Push',
  startedAt: '2026-05-22T10:00:00.000Z',
  sessionNotes: null,
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('completeSession', () => {
  let mockTx: { execute: ReturnType<typeof vi.fn> };
  let mockWriteTransaction: ReturnType<typeof vi.fn>;
  let mockMMKV: MockMMKVMod['__mockMMKV'];

  beforeEach(() => {
    const psMod = powersyncMod as unknown as MockPSMod;
    const mmkv = mmkvMod as unknown as MockMMKVMod;

    mockTx = psMod.__mockTx;
    mockWriteTransaction = psMod.__mockWriteTransaction;
    mockMMKV = mmkv.__mockMMKV;

    // Reset spies
    vi.clearAllMocks();
    mockMMKV.__store.clear();

    // Restore default mock implementations
    mockTx.execute.mockResolvedValue({});
    mockWriteTransaction.mockImplementation(async (cb: (tx: typeof mockTx) => Promise<void>) => {
      await cb(mockTx);
    });
  });

  it('calls writeTransaction exactly once', async () => {
    await completeSession(baseArgs);
    expect(mockWriteTransaction).toHaveBeenCalledTimes(1);
  });

  it('executes exactly TWO sql statements inside the writeTransaction callback', async () => {
    await completeSession(baseArgs);
    expect(mockTx.execute).toHaveBeenCalledTimes(2);
  });

  it('first execute is INSERT OR REPLACE INTO sessions with correct bindings', async () => {
    await completeSession(baseArgs);
    const [sql, bindings] = mockTx.execute.mock.calls[0] as [string, unknown[]];

    expect(sql).toMatch(/INSERT OR REPLACE INTO sessions/i);
    expect(bindings[0]).toBe(baseArgs.sessionId);
    expect(bindings[1]).toBe(baseArgs.userId);
    expect(bindings[2]).toBe(baseArgs.templateId);
    expect(bindings[3]).toBe(baseArgs.dayLabel);
    expect(bindings[4]).toBe(baseArgs.startedAt);
    // bindings[5] = completed_at — must be a non-empty ISO string
    expect(typeof bindings[5]).toBe('string');
    expect((bindings[5] as string).length).toBeGreaterThan(0);
    expect(bindings[6]).toBe(baseArgs.sessionNotes); // null
  });

  it('second execute is UPDATE split_settings rotation_pointer with correct binding', async () => {
    await completeSession(baseArgs);
    const [sql, bindings] = mockTx.execute.mock.calls[1] as [string, unknown[]];

    expect(sql).toMatch(/UPDATE split_settings SET rotation_pointer = rotation_pointer \+ 1/i);
    expect(sql).toMatch(/WHERE user_id = \?/i);
    expect(bindings[0]).toBe(baseArgs.userId);
  });

  it('uses INSERT OR REPLACE for sessions (idempotent by session UUID)', async () => {
    await completeSession(baseArgs);
    const firstSql = mockTx.execute.mock.calls[0][0] as string;
    expect(firstSql.toUpperCase()).toContain('INSERT OR REPLACE');
    expect(firstSql.toLowerCase()).toContain('sessions');
  });

  it('does not check rowsAffected (PowerSync JSON view returns 0)', async () => {
    mockTx.execute.mockResolvedValue({ rowsAffected: 0 });
    await expect(completeSession(baseArgs)).resolves.toBeUndefined();
  });

  it('clears MMKV active_session_id after successful writeTransaction', async () => {
    const removeSpy = vi.spyOn(mockMMKV, 'remove');
    await completeSession(baseArgs);
    expect(removeSpy).toHaveBeenCalledWith('active_session_id');
  });

  it('clears MMKV active_session_started_at after successful writeTransaction', async () => {
    const removeSpy = vi.spyOn(mockMMKV, 'remove');
    await completeSession(baseArgs);
    expect(removeSpy).toHaveBeenCalledWith('active_session_started_at');
  });

  it('uses .remove() to clear MMKV keys (v4 API — not .delete())', async () => {
    const removeSpy = vi.spyOn(mockMMKV, 'remove');
    await completeSession(baseArgs);
    expect(removeSpy).toHaveBeenCalled();
    // confirm no .delete property exists on the v4 mock
    expect(mockMMKV.delete).toBeUndefined();
  });

  it('does NOT clear MMKV when writeTransaction throws', async () => {
    const removeSpy = vi.spyOn(mockMMKV, 'remove');
    mockWriteTransaction.mockRejectedValueOnce(new Error('PowerSync write failure'));

    await expect(completeSession(baseArgs)).rejects.toThrow('PowerSync write failure');
    expect(removeSpy).not.toHaveBeenCalled();
  });

  it('propagates errors from writeTransaction to the caller', async () => {
    const err = new Error('disk full');
    mockWriteTransaction.mockRejectedValueOnce(err);
    await expect(completeSession(baseArgs)).rejects.toBe(err);
  });

  it('writeTransaction is called with both sessions upsert and split_settings rotation pointer increment', async () => {
    await completeSession(baseArgs);
    expect(mockWriteTransaction).toHaveBeenCalledTimes(1);
    expect(mockTx.execute).toHaveBeenCalledTimes(2);
    expect((mockTx.execute.mock.calls[0][0] as string).toLowerCase()).toContain('sessions');
    expect((mockTx.execute.mock.calls[1][0] as string).toLowerCase()).toContain('split_settings');
  });
});
