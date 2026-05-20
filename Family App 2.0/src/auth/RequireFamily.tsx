/**
 * Component-level family boundary.
 *
 * Wraps the authenticated app area (everything below RootLayout). When the
 * authenticated user has no `members` row linking them to a `families` row,
 * `useCurrentFamily().data` resolves to `null` and we redirect to the
 * `/onboarding/create-family` wizard (CONTEXT.md D-12 + ONBD-01).
 *
 * Why a component, not a loader:
 *   - The wizard (Plan 05) creates the missing `families` row and
 *     invalidates `['current-family']` on success. That invalidation
 *     re-runs `useCurrentFamily` automatically, so the component re-renders
 *     with `family` non-null and unblocks the user. A loader-based check
 *     would require an additional `navigate` call from inside the wizard's
 *     mutation, which is harder to reason about and easier to forget.
 *
 * Implementation notes:
 *   - The navigate is inside a useEffect (NOT at component body) so React
 *     can finish rendering before the side effect runs. Calling navigate
 *     during render produces "Cannot update during render" warnings.
 *   - The dependency array `[family, isLoading, navigate]` covers every
 *     value the effect reads; `navigate` is stable but lint-stable
 *     practice keeps it listed.
 *   - The loading branch renders a centered "Loading your family"
 *     placeholder so the user never sees a flash of empty page.
 *   - When `family === null` we return `null` (not children) — the
 *     useEffect handles the redirect, and rendering children would cause a
 *     RLS error storm because every downstream hook expects `family.id`.
 */
import { useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { useCurrentFamily } from '../data/useCurrentFamily';

export default function RequireFamily({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  const { data: family, isLoading } = useCurrentFamily();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && family === null) {
      navigate('/onboarding/create-family', { replace: true });
    }
  }, [family, isLoading, navigate]);

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          color: 'var(--text-muted)',
        }}
      >
        Loading your family
      </div>
    );
  }

  if (family === null) {
    // useEffect above is performing the redirect — render nothing in the
    // interim to avoid mounting children that would hit RLS errors.
    return null;
  }

  return <>{children}</>;
}
