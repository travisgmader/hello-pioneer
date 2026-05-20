/**
 * Wave 0 — v1 migration idempotency skeleton
 * Verifies that the Edge Function migration is safe to re-run.
 * Requires a Supabase test project with a fixture v1 user_state blob.
 * Full implementation in plan 01e (migration edge function).
 */
import { describe, it } from 'vitest';

describe('v1 migration idempotency', () => {
  it.todo('Migration produces expected v2 rows from fixture v1 blob');
  it.todo('Running migration twice produces the same result (idempotent)');
  it.todo('Migration_status changes from pending to complete on success');
  it.todo('New user (no v1 data) skips migration and lands on onboarding');
});
