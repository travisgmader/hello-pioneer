/**
 * Wave 0 — Password reset service test
 * Verifies that resetPassword is an exportable async function.
 * Full auth tests come in plan 01b (auth implementation).
 */
import { describe, it, expect } from 'vitest';
import { resetPassword } from '@/services/auth/email';

describe('resetPassword service', () => {
  it('resetPassword is an exported async function', () => {
    expect(typeof resetPassword).toBe('function');
  });

  it('resetPassword returns a promise', async () => {
    const result = resetPassword('test@example.com');
    expect(result).toBeInstanceOf(Promise);
    const resolved = await result;
    expect(resolved).toHaveProperty('error');
  });
});
