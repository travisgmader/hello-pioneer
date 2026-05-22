import { describe, it } from 'vitest';

describe('completeSession', () => {
  it.todo('writeTransaction is called with both sessions upsert and split_settings rotation pointer increment');
  it.todo('uses INSERT OR REPLACE for sessions (idempotent by session UUID)');
  it.todo('does not check rowsAffected (PowerSync JSON view returns 0)');
});
