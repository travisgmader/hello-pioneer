/**
 * /access-denied route — shown when authentication fails for a non-recoverable
 * reason (e.g. OAuth session carries no email due to provider misconfiguration).
 *
 * The sign-out button clears the session so the user can try a different
 * account on the next visit.
 */
import { supabase } from '../data/supabase';
import styles from './access-denied.module.css';

export default function AccessDenied() {
  const handleSignOut = () => {
    void supabase.auth.signOut();
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h1 className={styles.title}>Sign-in failed</h1>
        <p className={styles.body}>
          There was a problem signing you in. Please sign out and try again, or
          use a different account.
        </p>
        <button
          type="button"
          className={styles.signOutBtn}
          onClick={handleSignOut}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
