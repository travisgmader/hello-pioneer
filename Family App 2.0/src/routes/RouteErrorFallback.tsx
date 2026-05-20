/**
 * Route-level error boundary fallback (CONTEXT.md D-16 + ARCH-08).
 *
 * Rendered by React Router v7 whenever a route's loader or element throws
 * — wired via `errorElement: <RouteErrorFallback />` on every entry in
 * `src/routes/router.tsx`.
 *
 * Copy is locked to UI-SPEC §Copywriting Contract:
 *   - Heading: "Something went wrong on this page"
 *   - Body:    "We've logged the error. Try reloading, or head back to
 *              the dashboard."
 *   - Primary CTA:   "Reload this page"   (window.location.reload)
 *   - Secondary CTA: "Back to Dashboard"  (Link to /dashboard)
 *
 * Layout per UI-SPEC §Interaction Contracts: centered card on white
 * card-bg, destructive-pink heading, two buttons (stacked on mobile,
 * side-by-side on desktop, handled in the .module.css media query).
 *
 * Why we console.error inside the component: developers opening DevTools
 * after seeing the fallback want the stack trace immediately. Otherwise
 * the error is buried inside React Router's internal state and only
 * surfaces via `useRouteError`.
 */
import { Link, useRouteError, isRouteErrorResponse } from 'react-router';
import styles from './RouteErrorFallback.module.css';

export function RouteErrorFallback(): React.ReactElement {
  const error = useRouteError();

  // Surface the stack in DevTools for the developer who opens it after
  // hitting the fallback. Production users will not see this — only
  // the heading + body copy.
  if (isRouteErrorResponse(error)) {
    // eslint-disable-next-line no-console
    console.error('Route error response:', error.status, error.statusText, error.data);
  } else {
    // eslint-disable-next-line no-console
    console.error('Route error:', error);
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h1 className={styles.title}>Something went wrong on this page</h1>
        <p className={styles.body}>
          We&apos;ve logged the error. Try reloading, or head back to the dashboard.
        </p>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primary}
            onClick={() => window.location.reload()}
          >
            Reload this page
          </button>
          <Link to="/dashboard" className={styles.secondary}>
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

// Default export for ergonomic `import RouteErrorFallback from ...` calls
// in the router; the named export above is preserved for the test stub.
export default RouteErrorFallback;
