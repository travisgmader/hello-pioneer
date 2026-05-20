/**
 * Wave 0 RED stub — ARCH-01 (cross-tenant isolation enforced by RLS).
 *
 * Implementation lands in Plan 02. Skipped locally when service-role creds
 * are absent. Creates two synthetic families via service-role bypass, signs
 * in as a member of family A using the anon key, then asserts SELECT *
 * FROM families returns ONLY family A's row.
 */
import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const URL = process.env['SUPABASE_URL'];
const SERVICE_ROLE_KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'];
const ANON_KEY = process.env['SUPABASE_ANON_KEY'];
const SKIP = !URL || !SERVICE_ROLE_KEY || !ANON_KEY;

describe.skipIf(SKIP)('RLS isolation (Wave 0 RED stub — created in Plan 02)', () => {
  it('user signed into family A cannot see family B', async () => {
    const admin = createClient(URL ?? '', SERVICE_ROLE_KEY ?? '');
    const anon = createClient(URL ?? '', ANON_KEY ?? '');

    // Implementation in Plan 02 will:
    //   1. Create family A + family B via admin client
    //   2. Create one anon user, link to family A
    //   3. Sign in as that user via anon client
    //   4. SELECT * FROM families
    //   5. Assert only family A's row returned
    const { data, error } = await anon.from('families').select('*');
    expect(error).toBeNull();
    expect(data?.length).toBe(1);
    // Sanity: admin sees both rows (service role bypasses RLS).
    const { data: adminData } = await admin.from('families').select('*');
    expect((adminData ?? []).length).toBeGreaterThanOrEqual(2);
  });
});
