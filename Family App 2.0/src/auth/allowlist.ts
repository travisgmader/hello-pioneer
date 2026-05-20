/**
 * Email allowlist gate (D-08 / D-09 from CONTEXT.md).
 *
 * Source of truth is the `allowed_emails` table in Supabase. There is NO
 * hardcoded list and NO env var — a parent can manage the allowlist from
 * Settings (Phase 7) without a redeploy.
 *
 * The RLS SELECT policy on `allowed_emails` restricts each authenticated user
 * to their own row only (`lower(email) = lower(jwt ->> 'email')`). So
 * `maybeSingle()` returns the row when the caller is allowlisted, or `null`
 * when they are not — there is no way to read another family member's row.
 *
 * Triple-defense against case mismatch (RESEARCH.md threat T-03-05):
 *   1. Client lowercases + trims before the query.
 *   2. Allowlist rows are inserted lowercased in the bootstrap migration.
 *   3. The RLS policy itself lowercases both sides.
 */
import { supabase } from '../data/supabase';

/**
 * Check whether `email` appears in the `allowed_emails` table.
 *
 * Case-insensitive and whitespace-tolerant: `'  Travis.G.Mader@GMAIL.com  '`
 * resolves to the same row as `'travis.g.mader@gmail.com'`.
 *
 * @throws PostgrestError when the SELECT itself fails (network, auth,
 *   policy denial). A successful query that finds no row returns `false`,
 *   not an error — that is the "not allowlisted" success path.
 */
export async function isAllowedEmail(email: string): Promise<boolean> {
  const lowered = email.toLowerCase().trim();
  const { data, error } = await supabase
    .from('allowed_emails')
    .select('email')
    .eq('email', lowered)
    .maybeSingle();
  if (error) throw error;
  return data !== null;
}
