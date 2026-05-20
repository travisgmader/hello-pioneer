import type { PostgrestError } from '@supabase/supabase-js';

/**
 * Unwrap a Supabase Postgrest response, throwing on error or null data.
 *
 * Carried forward from v1 `../family-app/src/lib/db.js` lines 3–5:
 *   const check = (res) => { if (res.error) throw res.error; return res; };
 *
 * v2 differences:
 *   - Generic `<T>` so callers get back the row type, not `unknown`.
 *   - Throws on `data === null` too (a non-error empty result still means
 *     the caller's optimistic assumption was wrong — surface the failure
 *     so `.catch()` handlers actually fire).
 *
 * Use with any Supabase query that returns `{ data, error }`:
 *   const family = check(await supabase.from('families').select('*').single());
 */
export function check<T>(res: { data: T | null; error: PostgrestError | null }): T {
  if (res.error) throw res.error;
  if (res.data === null) throw new Error('No data returned');
  return res.data;
}
