/**
 * ARCH-02 (React Router v7 Data mode) + ARCH-08 (errorElement).
 *
 * Verifies the unauthenticated redirect path: with no Supabase session,
 * the loader on `/` throws redirect('/login'), and the Login route renders
 * its subtitle copy.
 *
 * GREEN transition: the router module landed in Plan 04 (01-04a).
 *
 * Mocking strategy:
 *   - Stub `src/data/supabase` with a no-session client so requireAuthLoader
 *     resolves `session` to null and throws redirect('/login') without
 *     touching the network or env vars.
 *   - Stub `src/lib/env` to short-circuit the env-vars throw — vitest
 *     workers don't see the .env.local file by default.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RouterProvider } from 'react-router';

vi.mock('../../src/lib/env', () => ({
  env: {
    supabaseUrl: 'http://localhost:54321',
    supabaseAnonKey: 'test-anon-key',
    vapidPublicKey: undefined,
  },
}));

vi.mock('../../src/data/supabase', () => ({
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      signOut: async () => ({ error: null }),
    },
  } as unknown,
  signInWithGoogle: vi.fn(),
  check: <T,>(res: { data: T | null }) => res.data,
}));

// Allowlist is never reached when session is null, but stub it anyway so
// the module import resolves cleanly without hitting Supabase.
vi.mock('../../src/auth/allowlist', () => ({
  isAllowedEmail: async () => true,
}));

const { router } = await import('../../src/routes/router');

describe('router', () => {
  it('routes to /login when unauthenticated', async () => {
    render(<RouterProvider router={router} />);
    expect(
      await screen.findByText("Sign in to access your family's dashboard"),
    ).toBeInTheDocument();
  });
});
