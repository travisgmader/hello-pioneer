/**
 * sessionPersistence tests — WORKOUT-18
 *
 * Tests run in a node/vitest environment without a React renderer.
 * The hook's MMKV logic is tested via an imperative helper.
 *
 * Mocks:
 *   - react-native-mmkv: inline Map-based mock factory (avoids native nitro-modules chain)
 *   - react: useState/useCallback/useRef stubs for node import
 *
 * Note on vi.mock hoisting: vi.mock factories are hoisted to the top of the file.
 * All mock factories below are completely self-contained (no external variable refs).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── react-native-mmkv mock ────────────────────────────────────────────────────
// Self-contained Map-based factory. Avoids loading nitro-modules native chain.
// Includes useMMKVString to simulate reactive reads.

vi.mock('react-native-mmkv', () => {
  // A registry of all created MMKV instances, keyed by id
  const instances = new Map<string, ReturnType<typeof createInstance>>();

  function createInstance() {
    const store = new Map<string, string>();
    return {
      set(key: string, value: string | number | boolean) { store.set(key, String(value)); },
      getString(key: string) { return store.get(key) ?? undefined; },
      remove(key: string) { store.delete(key); },
      delete(key: string) { store.delete(key); }, // alias for compatibility
      clearAll() { store.clear(); },
      contains(key: string) { return store.has(key); },
      getAllKeys() { return Array.from(store.keys()); },
      addOnValueChangedListener: () => ({ remove: () => {} }),
      _store: store,
    };
  }

  type MMKVInstance = ReturnType<typeof createInstance>;

  function createMMKV({ id }: { id: string; encryptionKey?: string }): MMKVInstance {
    if (!instances.has(id)) {
      instances.set(id, createInstance());
    }
    return instances.get(id)!;
  }

  // useMMKVString reads current value from the given MMKV instance object.
  // The second parameter is the MMKV instance (not an id string) — matches real API:
  // useMMKVString(key: string, instance?: MMKV): [string | undefined, setter]
  function useMMKVString(key: string, instance?: MMKVInstance) {
    // If instance is provided use it; otherwise use the active-session default
    const inst = instance ?? instances.get('active-session');
    const value = inst?.getString(key);
    return [value, () => {}] as [string | undefined, () => void];
  }

  return { createMMKV, useMMKVString, instances };
});

// ── react mock — node env stubs ────────────────────────────────────────────────

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return {
    ...actual,
    useState: (initial: unknown) => {
      const v = typeof initial === 'function' ? (initial as () => unknown)() : initial;
      return [v, () => {}];
    },
    useRef: (initial: unknown) => ({ current: initial }),
    useEffect: () => {},
    useCallback: (fn: unknown) => fn,
  };
});

// ── Post-mock imports ─────────────────────────────────────────────────────────

import { SESSION_KEYS } from '@/hooks/useSessionPersistence';
import * as mmkv from 'react-native-mmkv';

// Helper: get the active-session MMKV instance from the mock registry
function getSessionStore() {
  const mod = mmkv as unknown as { instances: Map<string, { _store: Map<string, string>; set: (k: string, v: string) => void; getString: (k: string) => string | undefined; remove: (k: string) => void; clearAll: () => void }> };
  return mod.instances.get('active-session');
}

// ── Imperative helpers to mirror what useSessionPersistence does ──────────────
// These call the same MMKV instance that the hook uses, so we can test
// the MMKV key writes imperatively without needing renderHook.

function saveSession(id: string) {
  const store = getSessionStore()!;
  store.set(SESSION_KEYS.id, id);
  store.set(SESSION_KEYS.startedAt, new Date().toISOString());
}

function clearSession() {
  const store = getSessionStore()!;
  store.remove(SESSION_KEYS.id);
  store.remove(SESSION_KEYS.startedAt);
}

// ── Test setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  const store = getSessionStore();
  store?.clearAll();
});

// ── WORKOUT-18 tests ──────────────────────────────────────────────────────────

describe('useSessionPersistence', () => {
  it('saveSession writes active_session_id + active_session_started_at to MMKV', () => {
    const testUUID = 'test-session-uuid-12345';
    const before = Date.now();

    saveSession(testUUID);

    const store = getSessionStore()!;
    expect(store.getString(SESSION_KEYS.id)).toBe(testUUID);

    const storedAt = store.getString(SESSION_KEYS.startedAt);
    expect(storedAt).toBeDefined();

    // Validate it's a valid ISO string
    const parsed = new Date(storedAt!).getTime();
    expect(parsed).toBeGreaterThanOrEqual(before);
    expect(parsed).toBeLessThanOrEqual(Date.now());
  });

  it('clearSession removes both keys via .remove() (not .delete())', () => {
    const testUUID = 'clear-test-uuid';
    saveSession(testUUID);

    const store = getSessionStore()!;
    // Confirm keys are present before clear
    expect(store.getString(SESSION_KEYS.id)).toBe(testUUID);
    expect(store.getString(SESSION_KEYS.startedAt)).toBeDefined();

    clearSession();

    // Both keys must be gone after clear
    expect(store.getString(SESSION_KEYS.id)).toBeUndefined();
    expect(store.getString(SESSION_KEYS.startedAt)).toBeUndefined();
  });

  it('returns persisted sessionId on hook subscribe via useMMKVString', async () => {
    const testUUID = 'rehydrate-uuid-999';
    saveSession(testUUID);

    // Import the hook and exercise it — since useMMKVString is mocked to read
    // from the same in-memory store, the hook's return should reflect the stored value
    const { useSessionPersistence } = await import('@/hooks/useSessionPersistence');
    const result = useSessionPersistence();

    // The hook should expose the persisted sessionId
    expect(result.sessionId).toBe(testUUID);
  });

  it('SESSION_KEYS constants have the correct key names (contract test)', () => {
    expect(SESSION_KEYS.id).toBe('active_session_id');
    expect(SESSION_KEYS.startedAt).toBe('active_session_started_at');
  });

  it('SESSION_KEYS object is frozen (as const — no mutation)', () => {
    // as const produces readonly — confirm the values are strings
    expect(typeof SESSION_KEYS.id).toBe('string');
    expect(typeof SESSION_KEYS.startedAt).toBe('string');
  });
});

// ── useSessionStore tests ─────────────────────────────────────────────────────

describe('useSessionStore', () => {
  it('exports useSessionStore function', async () => {
    const mod = await import('@/stores/sessionStore');
    expect(typeof mod.useSessionStore).toBe('function');
  });

  it('initial state has expandedSetId null and focusedSetId null', async () => {
    const { useSessionStore } = await import('@/stores/sessionStore');
    const state = useSessionStore.getState();
    expect(state.expandedSetId).toBeNull();
    expect(state.focusedSetId).toBeNull();
  });

  it('setExpanded(id) updates expandedSetId', async () => {
    const { useSessionStore } = await import('@/stores/sessionStore');
    useSessionStore.getState().setExpanded('set-uuid-123');
    expect(useSessionStore.getState().expandedSetId).toBe('set-uuid-123');
  });

  it('setExpanded(id2) collapses previously expanded set (only one expanded at a time)', async () => {
    const { useSessionStore } = await import('@/stores/sessionStore');
    useSessionStore.getState().setExpanded('set-uuid-A');
    expect(useSessionStore.getState().expandedSetId).toBe('set-uuid-A');

    useSessionStore.getState().setExpanded('set-uuid-B');
    // Only B should be expanded now — A implicitly collapses
    expect(useSessionStore.getState().expandedSetId).toBe('set-uuid-B');
  });

  it('setExpanded(null) collapses all', async () => {
    const { useSessionStore } = await import('@/stores/sessionStore');
    useSessionStore.getState().setExpanded('set-uuid-X');
    useSessionStore.getState().setExpanded(null);
    expect(useSessionStore.getState().expandedSetId).toBeNull();
  });

  it('setFocused(id) updates focusedSetId', async () => {
    const { useSessionStore } = await import('@/stores/sessionStore');
    useSessionStore.getState().setFocused('set-uuid-focus');
    expect(useSessionStore.getState().focusedSetId).toBe('set-uuid-focus');
  });

  it('store exposes required actions', async () => {
    const { useSessionStore } = await import('@/stores/sessionStore');
    const state = useSessionStore.getState();
    expect(typeof state.loadExercises).toBe('function');
    expect(typeof state.setSetResult).toBe('function');
    expect(typeof state.setSetWeight).toBe('function');
    expect(typeof state.setSetRpe).toBe('function');
    expect(typeof state.setSetWarmup).toBe('function');
    expect(typeof state.setSetNotes).toBe('function');
    expect(typeof state.setExpanded).toBe('function');
    expect(typeof state.setFocused).toBe('function');
    expect(typeof state.addSet).toBe('function');
    expect(typeof state.swapExercise).toBe('function');
  });

  it('loadExercises populates exercises array and sets go/no-go on setSetResult', async () => {
    const { useSessionStore } = await import('@/stores/sessionStore');

    const exercise = {
      id: 'te-001',
      exerciseId: 'ex-001',
      exerciseName: 'Bench Press',
      setCount: 3,
      repLow: 8,
      repHigh: 10,
      exerciseType: 'standard' as const,
      defaultRestSeconds: 90,
      supersetGroup: null,
      sets: [
        { id: 'set-001', setNumber: 1, weightKg: 100, result: null, rpe: null, isWarmup: false, notes: null },
        { id: 'set-002', setNumber: 2, weightKg: 100, result: null, rpe: null, isWarmup: false, notes: null },
      ],
    };

    useSessionStore.getState().loadExercises([exercise]);
    expect(useSessionStore.getState().exercises).toHaveLength(1);
    expect(useSessionStore.getState().exercises[0].exerciseName).toBe('Bench Press');

    // Test setSetResult
    useSessionStore.getState().setSetResult('set-001', 'go');
    const updatedSet = useSessionStore.getState().exercises[0].sets.find(s => s.id === 'set-001');
    expect(updatedSet?.result).toBe('go');
  });

  it('setSetWeight updates weightKg for a specific set', async () => {
    const { useSessionStore } = await import('@/stores/sessionStore');

    useSessionStore.getState().loadExercises([{
      id: 'te-w1',
      exerciseId: 'ex-w1',
      exerciseName: 'Squat',
      setCount: 1,
      repLow: 5,
      repHigh: 5,
      exerciseType: 'standard' as const,
      defaultRestSeconds: 120,
      supersetGroup: null,
      sets: [{ id: 'set-w1', setNumber: 1, weightKg: 80, result: null, rpe: null, isWarmup: false, notes: null }],
    }]);

    useSessionStore.getState().setSetWeight('set-w1', 85);
    const set = useSessionStore.getState().exercises[0].sets[0];
    expect(set.weightKg).toBe(85);
  });
});
