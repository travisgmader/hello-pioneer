/**
 * RLS isolation tests — verifies cross-user data access is denied by Postgres RLS.
 * Requires EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY env vars.
 * In CI these come from GitHub Actions secrets; locally from .env.local.
 *
 * Note: These tests require two pre-created test users in the Supabase project.
 * Create them via the Supabase Dashboard → Authentication → Users before running.
 */
import { createClient } from '@supabase/supabase-js';
import { describe, it, expect, beforeAll } from 'vitest';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Skip entire suite when env vars are not configured (avoids CI false-positives)
const skipSuite = !supabaseUrl || !supabaseAnonKey;

describe.skipIf(skipSuite)('RLS isolation', () => {
  const clientA = createClient<Database>(supabaseUrl, supabaseAnonKey);
  const clientB = createClient<Database>(supabaseUrl, supabaseAnonKey);

  const testUserAEmail = process.env.RLS_TEST_USER_A_EMAIL ?? 'rls-test-a@razeandrise.test';
  const testUserAPassword = process.env.RLS_TEST_USER_A_PASSWORD ?? '';
  const testUserBEmail = process.env.RLS_TEST_USER_B_EMAIL ?? 'rls-test-b@razeandrise.test';
  const testUserBPassword = process.env.RLS_TEST_USER_B_PASSWORD ?? '';

  let sessionAId: string;

  beforeAll(async () => {
    if (!testUserAPassword || !testUserBPassword) return;

    await clientA.auth.signInWithPassword({ email: testUserAEmail, password: testUserAPassword });
    await clientB.auth.signInWithPassword({ email: testUserBEmail, password: testUserBPassword });

    // Insert a session as User A
    sessionAId = crypto.randomUUID();
    await clientA.from('sessions').insert({
      id: sessionAId,
      user_id: (await clientA.auth.getUser()).data.user!.id,
      started_at: new Date().toISOString(),
    });
  });

  it('User A can read their own sessions row', async () => {
    const { data, error } = await clientA.from('sessions').select('id').eq('id', sessionAId);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it('User B cannot read User A sessions rows (RLS blocks cross-user SELECT)', async () => {
    const { data, error } = await clientB.from('sessions').select('id').eq('id', sessionAId);
    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });

  it('User A cannot read User B profile row', async () => {
    const userBId = (await clientB.auth.getUser()).data.user?.id;
    if (!userBId) return;
    const { data } = await clientA.from('profiles').select('user_id').eq('user_id', userBId);
    expect(data).toHaveLength(0);
  });

  it('Built-in exercises (is_custom=false) are visible to both users', async () => {
    const { data: dataA } = await clientA.from('exercises').select('id').eq('is_custom', false);
    const { data: dataB } = await clientB.from('exercises').select('id').eq('is_custom', false);
    expect((dataA ?? []).length).toBeGreaterThan(0);
    expect((dataB ?? []).length).toEqual((dataA ?? []).length);
  });
});
