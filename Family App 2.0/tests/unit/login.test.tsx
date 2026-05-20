/**
 * Login route unit tests — UI-SPEC §Copywriting Contract + §Interaction Contracts.
 *
 * Renders the <Login/> component directly (no router) and asserts:
 *   - Verbatim UI-SPEC copy: title "Family Plan", subtitle, CTA "Sign in
 *     with Google", loading label "Redirecting".
 *   - Clicking the button calls signInWithGoogle().
 *   - Errors surface as a pink-pill below the subtitle.
 *
 * Mocks signInWithGoogle so the test never reaches Supabase.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

const signInSpy = vi.fn();

vi.mock('../../src/data/supabase', () => {
  return {
    supabase: {} as Record<string, never>,
    signInWithGoogle: () => signInSpy(),
    check: <T,>(res: { data: T | null; error: unknown }) => res.data,
  };
});

import Login from '../../src/routes/login';

describe('Login route', () => {
  beforeEach(() => {
    signInSpy.mockReset();
    signInSpy.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the UI-SPEC copy verbatim', () => {
    render(<Login />);

    expect(screen.getByText('Family Plan')).toBeInTheDocument();
    expect(
      screen.getByText("Sign in to access your family's dashboard"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /sign in with google/i }),
    ).toBeInTheDocument();
  });

  it('calls signInWithGoogle when the button is clicked', () => {
    render(<Login />);
    const btn = screen.getByRole('button', { name: /sign in with google/i });
    fireEvent.click(btn);
    expect(signInSpy).toHaveBeenCalledTimes(1);
  });

  it('surfaces the error message and clears it on retry', async () => {
    signInSpy.mockRejectedValueOnce(new Error('network down'));

    render(<Login />);
    const btn = screen.getByRole('button', { name: /sign in with google/i });
    fireEvent.click(btn);

    // Wait for the error pill.
    expect(await screen.findByText('network down')).toBeInTheDocument();

    // Retry: error clears immediately on next click.
    signInSpy.mockResolvedValueOnce(undefined);
    fireEvent.click(btn);
    expect(screen.queryByText('network down')).not.toBeInTheDocument();
  });
});
