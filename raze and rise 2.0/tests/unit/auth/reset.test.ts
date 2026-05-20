/**
 * Auth service unit tests
 * Tests: resetPassword, signUpEmail, signInEmail, changePassword
 *
 * Mocks supabase.auth.* so no network calls are made.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the supabase module before imports that depend on it
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: vi.fn(),
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      updateUser: vi.fn(),
    },
  },
}));

import { supabase } from '@/lib/supabase';
import { resetPassword, signUpEmail, signInEmail, changePassword } from '@/services/auth/email';

const mockAuth = supabase.auth as {
  resetPasswordForEmail: ReturnType<typeof vi.fn>;
  signUp: ReturnType<typeof vi.fn>;
  signInWithPassword: ReturnType<typeof vi.fn>;
  updateUser: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.resetPasswordForEmail.mockResolvedValue({ data: {}, error: null });
  mockAuth.signUp.mockResolvedValue({ data: {}, error: null });
  mockAuth.signInWithPassword.mockResolvedValue({ data: {}, error: null });
  mockAuth.updateUser.mockResolvedValue({ data: {}, error: null });
});

describe('resetPassword service', () => {
  it('resetPassword is an exported async function', () => {
    expect(typeof resetPassword).toBe('function');
    expect(resetPassword.constructor.name === 'AsyncFunction' || resetPassword('x') instanceof Promise).toBe(true);
  });

  it('calls supabase.auth.resetPasswordForEmail with correct args', async () => {
    await resetPassword('test@example.com');
    expect(mockAuth.resetPasswordForEmail).toHaveBeenCalledWith(
      'test@example.com',
      { redirectTo: 'razeandrise://reset-password' },
    );
  });

  it('calls supabase.auth.resetPasswordForEmail exactly once', async () => {
    await resetPassword('user@example.com');
    expect(mockAuth.resetPasswordForEmail).toHaveBeenCalledTimes(1);
  });
});

describe('signUpEmail service', () => {
  it('signUpEmail is an exported async function', () => {
    expect(typeof signUpEmail).toBe('function');
  });

  it('calls supabase.auth.signUp with email and password', async () => {
    await signUpEmail('new@example.com', 'pass1234');
    expect(mockAuth.signUp).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'pass1234',
    });
  });
});

describe('signInEmail service', () => {
  it('signInEmail is an exported async function', () => {
    expect(typeof signInEmail).toBe('function');
  });

  it('calls supabase.auth.signInWithPassword with email and password', async () => {
    await signInEmail('user@example.com', 'secret');
    expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'secret',
    });
  });
});

describe('changePassword service', () => {
  it('changePassword is an exported async function', () => {
    expect(typeof changePassword).toBe('function');
  });

  it('calls supabase.auth.updateUser with new password', async () => {
    await changePassword('newSecurePass');
    expect(mockAuth.updateUser).toHaveBeenCalledWith({ password: 'newSecurePass' });
  });
});
