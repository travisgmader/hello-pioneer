/**
 * deterministicUuid — mirrors the UUIDv5 helper from the Edge Function.
 *
 * Uses Web Crypto (available in Node 18+, Deno, and Vitest's jsdom/node env).
 * Produces the same UUID for the same inputs — used in migration tests to
 * verify idempotency and correct ID generation.
 *
 * Namespace: URL namespace "6ba7b810-9dad-11d1-80b4-00c04fd430c8"
 */
export async function deterministicUuid(...parts: string[]): Promise<string> {
  const namespace = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
  const name = parts.join(':');
  const nsBytes = namespace
    .replace(/-/g, '')
    .match(/../g)!
    .map(h => parseInt(h, 16));
  const nameBytes = new TextEncoder().encode(name);
  const data = new Uint8Array([...nsBytes, ...nameBytes]);
  const hash = await crypto.subtle.digest('SHA-1', data);
  const bytes = new Uint8Array(hash).slice(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50; // version 5
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant
  const hex = Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
