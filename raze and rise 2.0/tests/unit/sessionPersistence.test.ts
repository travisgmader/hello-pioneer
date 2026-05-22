import { describe, it } from 'vitest';

describe('useSessionPersistence', () => {
  it.todo('saveSession writes active_session_id + active_session_started_at to MMKV');
  it.todo('clearSession removes both keys via .remove() (not .delete())');
  it.todo('returns persisted sessionId on hook subscribe via useMMKVString');
});
