/**
 * Wave 0 RED stub — ARCH-08 (errorElement on every route).
 *
 * The RouteErrorFallback component is created in Plan 04. Until then this
 * test MUST fail at import time. Asserts the copy from UI-SPEC
 * §Copywriting Contract.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  createMemoryRouter,
  RouterProvider,
} from 'react-router';
// @ts-expect-error — component is created in Plan 04
import { RouteErrorFallback } from '../../src/routes/RouteErrorFallback';

function Boom(): never {
  throw new Error('boom');
}

describe('RouteErrorFallback (Wave 0 RED stub — created in Plan 04)', () => {
  it('renders the generic error copy when a route throws', () => {
    const router = createMemoryRouter([
      {
        path: '/',
        element: <Boom />,
        errorElement: <RouteErrorFallback />,
      },
    ]);
    render(<RouterProvider router={router} />);
    expect(
      screen.getByText('Something went wrong on this page'),
    ).toBeInTheDocument();
  });
});
