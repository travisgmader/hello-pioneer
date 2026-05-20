/**
 * React Router v7 Data-mode router (ARCH-02 + ARCH-08 + D-16).
 *
 * Route topology — final shape. 01-04b mounts the visual shell on top of
 * these declarations by replacing the `<Stub />` placeholder element
 * references with the real components; the `path`/`loader`/`errorElement`
 * properties do NOT change.
 *
 * TODO (01-04b — Visual shell):
 *   - import RootLayout from './RootLayout' and replace `element: <Stub />`
 *     on the RootLayout wrapper.
 *   - import Dashboard from './(app)/dashboard' and replace the dashboard
 *     `element: <Stub />`.
 *   - import Chores from './(app)/chores' and replace the chores
 *     `element: <Stub />`.
 *   - import Calendar from './(app)/calendar' and replace the calendar
 *     `element: <Stub />`.
 *   - import Meals from './(app)/meals' and replace the meals
 *     `element: <Stub />`.
 *   - import Groceries from './(app)/groceries' and replace the groceries
 *     `element: <Stub />`.
 *   - import Notes from './(app)/notes' and replace the notes
 *     `element: <Stub />`.
 *
 * TODO (Plan 05 — Family Creation Wizard):
 *   - import CreateFamily from './onboarding/create-family' and replace
 *     the onboarding/create-family `element: <Stub />`.
 *
 * Auth boundary (D-16 + Pitfall 1):
 *   - `/` carries `requireAuthLoader` so unauthenticated traffic redirects
 *     to /login BEFORE any protected component mounts.
 *   - `/onboarding/create-family` is INSIDE `/` so the loader still runs,
 *     but it is OUTSIDE the RootLayout wrapper so RequireFamily does not
 *     intercept the wizard itself (which is the route that creates the
 *     missing family).
 *   - Every route (including the catch-all `*`) carries
 *     `errorElement: <RouteErrorFallback />`.
 *
 * Imports come from `react-router` (the v7 package) — the legacy dom-suffixed
 * package name from v6 is gone in v7.
 */
import { createBrowserRouter, redirect } from 'react-router';
import { requireAuthLoader } from '../auth/RequireAuth';
import RouteErrorFallback from './RouteErrorFallback';
import Login from './login';
import AccessDenied from './access-denied';

/**
 * Placeholder element used wherever 01-04b or Plan 05 will mount the real
 * component. Named `Stub` (not `RootLayout`) so 01-04b's
 * `import RootLayout from './RootLayout'` cleanly replaces the reference
 * without a name collision.
 */
const Stub = (): null => null;

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
    errorElement: <RouteErrorFallback />,
  },
  {
    path: '/access-denied',
    element: <AccessDenied />,
    errorElement: <RouteErrorFallback />,
  },
  {
    path: '/',
    loader: requireAuthLoader,
    errorElement: <RouteErrorFallback />,
    children: [
      {
        path: 'onboarding/create-family',
        element: <Stub />,
        errorElement: <RouteErrorFallback />,
      },
      {
        // RootLayout wrapper (01-04b replaces <Stub /> with <RootLayout />).
        // RootLayout itself mounts <RequireFamily> internally.
        element: <Stub />,
        errorElement: <RouteErrorFallback />,
        children: [
          { path: '', loader: () => redirect('/dashboard') },
          {
            path: 'dashboard',
            element: <Stub />,
            errorElement: <RouteErrorFallback />,
          },
          {
            path: 'chores',
            element: <Stub />,
            errorElement: <RouteErrorFallback />,
          },
          {
            path: 'calendar',
            element: <Stub />,
            errorElement: <RouteErrorFallback />,
          },
          {
            path: 'meals',
            element: <Stub />,
            errorElement: <RouteErrorFallback />,
          },
          {
            path: 'groceries',
            element: <Stub />,
            errorElement: <RouteErrorFallback />,
          },
          {
            path: 'notes',
            element: <Stub />,
            errorElement: <RouteErrorFallback />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <RouteErrorFallback />,
    errorElement: <RouteErrorFallback />,
  },
]);
