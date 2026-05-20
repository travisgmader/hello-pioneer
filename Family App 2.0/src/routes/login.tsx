/**
 * /login route — Google OAuth sign-in card.
 *
 * UI-SPEC contract (verbatim copy required by the checker):
 *   - Title:    "Family Plan"
 *   - Subtitle: "Sign in to access your family's dashboard"
 *   - CTA:      "Sign in with Google"  /  loading state: "Redirecting…"
 *
 * Interaction contract:
 *   - Clicking the button calls signInWithGoogle(); the browser navigates
 *     away on the success path, so we don't clear `loading` on success.
 *   - If signInWithGoogle throws, the error pill renders below the subtitle
 *     and the button re-enables. Clicking again clears the error first so
 *     a retry shows a clean state.
 *
 * The route is mounted at `/login` by Plan 04's router; this file only owns
 * the component, not the route table.
 */
import { useState } from 'react';
import { signInWithGoogle } from '../data/supabase';
import GoogleIcon from '../components/GoogleIcon';
import styles from './login.module.css';

export default function Login() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      // On success the browser navigates to Google; we do not clear `loading`
      // here so the disabled state persists until the navigation happens.
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h1 className={styles.title}>Family Plan</h1>
        <p className={styles.subtitle}>Sign in to access your family&apos;s dashboard</p>
        {error && <p className={styles.error}>{error}</p>}
        <button
          type="button"
          className={styles.googleBtn}
          onClick={handleGoogle}
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? (
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
