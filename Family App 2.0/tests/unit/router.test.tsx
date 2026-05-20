/**
 * Wave 0 RED stub — ARCH-02 (React Router v7 Data mode) + ARCH-08 (errorElement).
 *
 * The router module is created in Plan 04 of this phase. Until then this test
 * MUST fail at import time (module-not-found is the RED state). Once Plan 04
 * lands `src/routes/router.tsx`, this test turns GREEN.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RouterProvider } from 'react-router';
// @ts-expect-error — module is created in Plan 04
import { router } from '../../src/routes/router';

describe('router (Wave 0 RED stub — created in Plan 04)', () => {
  it('routes to /login when unauthenticated', async () => {
    render(<RouterProvider router={router} />);
    expect(
      await screen.findByText("Sign in to access your family's dashboard"),
    ).toBeInTheDocument();
  });
});
