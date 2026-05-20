/**
 * ARCH-08 (errorElement on every route).
 *
 * Asserts the copy from UI-SPEC §Copywriting Contract — when a route
 * element throws, RouteErrorFallback renders with the locked-in heading.
 *
 * GREEN transition: the component landed in Plan 04 (01-04a).
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  createMemoryRouter,
  RouterProvider,
} from 'react-router';
import { RouteErrorFallback } from '../../src/routes/RouteErrorFallback';

function Boom(): never {
  throw new Error('boom');
}

describe('RouteErrorFallback', () => {
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
