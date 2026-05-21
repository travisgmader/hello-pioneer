/**
 * React Router v7 Data-mode router (ARCH-02 + ARCH-08 + D-16).
 *
 * Route topology — final shape. 01-04b has mounted the visual shell by
 * replacing the `<Stub />` placeholder element references with real components
 * for the layout and all six tab routes.
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
import RootLayout from './RootLayout';
import Dashboard from './dashboard';
import Chores from './chores';
import Calendar from './calendar';
import Meals from './meals';
import Groceries from './groceries';
import Notes from './notes';

/**
 * Placeholder element used only for the `onboarding/create-family` route until
 * Plan 05 Task 5.2 replaces it with `import CreateFamily from './onboarding/create-family'`.
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
        // RootLayout wraps all six tab routes. RequireFamily is mounted inside
        // RootLayout — it redirects to /onboarding/create-family if no family.
        element: <RootLayout />,
        errorElement: <RouteErrorFallback />,
        children: [
          { path: '', loader: () => redirect('/dashboard') },
          {
            path: 'dashboard',
            element: <Dashboard />,
            errorElement: <RouteErrorFallback />,
          },
          {
            path: 'chores',
            element: <Chores />,
            errorElement: <RouteErrorFallback />,
          },
          {
            path: 'calendar',
            element: <Calendar />,
            errorElement: <RouteErrorFallback />,
          },
          {
            path: 'meals',
            element: <Meals />,
            errorElement: <RouteErrorFallback />,
          },
          {
            path: 'groceries',
            element: <Groceries />,
            errorElement: <RouteErrorFallback />,
          },
          {
            path: 'notes',
            element: <Notes />,
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
