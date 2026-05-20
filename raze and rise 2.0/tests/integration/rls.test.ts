/**
 * Wave 0 — RLS isolation skeleton
 * Verifies that cross-user data access is denied by Postgres RLS policies.
 * Requires a live Supabase test project with seeded test users.
 * Full implementation in plan 01c (schema + RLS).
 */
import { describe, it } from 'vitest';

describe('RLS isolation', () => {
  it.todo('User A cannot read User B session_sets rows');
  it.todo('User A cannot read User B sessions rows');
  it.todo('User A cannot read User B profile row');
  it.todo('Unauthenticated request returns empty result on all tables');
});
