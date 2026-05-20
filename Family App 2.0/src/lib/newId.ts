/**
 * Generate a v4 UUID for a new domain row.
 *
 * Replaces v1's `'c' + Date.now()` anti-pattern (which collided on rapid
 * back-to-back inserts and couldn't be used as a Postgres `uuid` primary key).
 *
 * `crypto.randomUUID()` is available in all evergreen browsers
 * (Chrome 92+, Firefox 95+, Safari 15.4+) and ships 122 bits of entropy.
 * Requires a secure context (HTTPS or localhost) — Vercel always provides
 * HTTPS for the deployed app.
 *
 * Client-generated IDs are what enable TanStack Query optimistic updates
 * without temp-id reconciliation (CLAUDE.md §UUID Generation).
 */
export const newId = (): string => crypto.randomUUID();
