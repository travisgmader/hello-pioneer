/**
 * /login route — Sign in with Apple + Google.
 *
 * Apple Sign-In is first per App Store Review Guidelines §4.8: if you offer
 * any third-party social sign-in (Google), Sign in with Apple must be offered
 * and at least as prominent.
 *
 * Both buttons share the same interaction contract:
 *   - Click calls the respective signIn helper; browser navigates away on
 *     success, so loading state is not cleared on success.
 *   - On error the error pill renders and the button re-enables.
 *   - A second click clears the error first so retries show a clean state.
 */
import { useState } from 'react';
import { signInWithApple, signInWithGoogle } from '../data/supabase';
import AppleIcon from '../components/AppleIcon';
import GoogleIcon from '../components/GoogleIcon';
import styles from './login.module.css';

export default function Login() {
  const [loading, setLoading] = useState<'apple' | 'google' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleApple = async () => {
    setLoading('apple');
    setError(null);
    try {
      await signInWithApple();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(null);
    }
  };

  const handleGoogle = async () => {
    setLoading('google');
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(null);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h1 className={styles.title}>Family Hub</h1>
        <p className={styles.subtitle}>Sign in to access your family&apos;s dashboard</p>
        {error && <p className={styles.error}>{error}</p>}
        <button
          type="button"
          className={styles.appleBtn}
          onClick={handleApple}
          disabled={loading !== null}
          aria-busy={loading === 'apple'}
        >
          {loading === 'apple' ? (
            'Redirecting…'
          ) : (
            <>
              <AppleIcon />
              Sign in with Apple
            </>
          )}
        </button>
        <button
          type="button"
          className={styles.googleBtn}
          onClick={handleGoogle}
          disabled={loading !== null}
          aria-busy={loading === 'google'}
        >
          {loading === 'google' ? (
            'Redirecting…'
          ) : (
            <>
              <GoogleIcon />
              Sign in with Google
            </>
          )}
        </button>
      </div>
    </div>
  );
}
