/**
 * Wave 0 RED stub — ARCH-05 (RLS everywhere), ARCH-06 (audit columns),
 * ARCH-11 (allowed_emails table).
 *
 * The initial migration is created in Plan 02. Until then this test asserts
 * the full table set + RLS policies are present in the linked Supabase
 * project. Skipped locally when SUPABASE_SERVICE_ROLE_KEY is not set.
 */
import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const URL = process.env['SUPABASE_URL'];
const SERVICE_ROLE_KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'];
const SKIP = !URL || !SERVICE_ROLE_KEY;

const EXPECTED_TABLES = [
  'families',
  'members',
  'family_settings',
  'allowed_emails',
  'chores',
  'chore_completions',
  'events',
  'meals',
  'groceries',
  'notes',
  'push_subscriptions',
  'notifications_queue',
  'family_links',
];

const EXPECTED_RLS_TABLES = ['families', 'members', 'family_settings', 'allowed_emails'];

describe.skipIf(SKIP)('schema (Wave 0 RED stub — created in Plan 02)', () => {
  const admin = createClient(URL ?? '', SERVICE_ROLE_KEY ?? '');

  it('declares every required table', async () => {
    const { data, error } = await admin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    expect(error).toBeNull();
    const names = (data ?? []).map((r: { table_name: string }) => r.table_name);
    for (const t of EXPECTED_TABLES) {
      expect(names).toContain(t);
    }
  });

  it('enables RLS on the tenant-critical tables', async () => {
    const { data, error } = await admin
      .from('pg_policies')
      .select('tablename')
      .eq('schemaname', 'public');
    expect(error).toBeNull();
    const policiedTables = new Set(
      (data ?? []).map((r: { tablename: string }) => r.tablename),
    );
    for (const t of EXPECTED_RLS_TABLES) {
      expect(policiedTables.has(t)).toBe(true);
    }
  });
});
