/**
 * Access Denied route unit tests — UI-SPEC §Copywriting Contract.
 *
 * Renders <AccessDenied/> under a MemoryRouter so `useSearchParams`
 * resolves, and asserts:
 *   - The heading copy: "This email isn't on the family list"
 *   - The body interpolates `?email=...` inside a <strong> tag
 *   - Missing email param falls back to "your account"
 *   - The "Sign out" button calls supabase.auth.signOut()
 *
 * Mocks supabase so signOut is observable and no network is touched.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

const signOutSpy = vi.fn();

vi.mock('../../src/data/supabase', () => {
  return {
    supabase: {
      auth: {
        signOut: () => {
          signOutSpy();
          return Promise.resolve({ error: null });
        },
      },
    },
    check: <T,>(res: { data: T | null; error: unknown }) => res.data,
  };
});

import AccessDenied from '../../src/routes/access-denied';

const renderAt = (search: string) => {
  return render(
    <MemoryRouter initialEntries={[`/access-denied${search}`]}>
      <AccessDenied />
    </MemoryRouter>,
  );
};

describe('AccessDenied route', () => {
  beforeEach(() => {
    signOutSpy.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the heading and interpolates the email from the query string', () => {
    renderAt('?email=foo%40example.com');

    expect(
      screen.getByText("This email isn't on the family list"),
    ).toBeInTheDocument();

    // The body text after the email is what makes the sentence unique;
    // assert the suffix string so the matcher tolerates the <strong> split.
    expect(
      screen.getByText(/doesn't have access to this Family Plan/),
    ).toBeInTheDocument();

    // The email itself is rendered inside a <strong> tag.
    const strong = screen.getByText('foo@example.com');
    expect(strong.tagName).toBe('STRONG');
  });

  it('falls back to "your account" when no email query param is provided', () => {
    renderAt('');

    expect(screen.getByText('your account')).toBeInTheDocument();
  });

  it('calls supabase.auth.signOut when the Sign out button is clicked', () => {
    renderAt('?email=foo%40example.com');

    fireEvent.click(screen.getByRole('button', { name: /sign out/i }));
    expect(signOutSpy).toHaveBeenCalledTimes(1);
  });
});
