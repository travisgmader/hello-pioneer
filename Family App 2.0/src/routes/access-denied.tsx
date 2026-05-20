/**
 * /access-denied route — shown when an authenticated user's email is NOT
 * in the `allowed_emails` table (D-09 from CONTEXT.md).
 *
 * UI-SPEC §Copywriting Contract — verbatim copy required by the checker:
 *   - Heading: "This email isn't on the family list"
 *   - Body:    "{email} doesn't have access to this Family Plan. Ask a
 *               parent to add you, then sign in again."
 *   - CTA:     "Sign out"
 *
 * The rejected email comes from the `?email=` query param so the user can
 * tell which Google account hit the gate (UI-SPEC: "Surface the email").
 * Missing param falls back to the placeholder "your account".
 *
 * Sign-out is single-tap, no confirmation (UI-SPEC §Destructive actions —
 * matches v1 behavior, the action is reversible by signing back in).
 *
 * The route is mounted at `/access-denied` by Plan 04's router; this file
 * only owns the component.
 */
import { useSearchParams } from 'react-router';
import { supabase } from '../data/supabase';
import styles from './access-denied.module.css';

export default function AccessDenied() {
  const [params] = useSearchParams();
  const email = params.get('email') ?? 'your account';

  const handleSignOut = () => {
    void supabase.auth.signOut();
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h1 className={styles.title}>This email isn&apos;t on the family list</h1>
        <p className={styles.body}>
          <strong>{email}</strong> doesn&apos;t have access to this Family Plan.
          Ask a parent to add you, then sign in again.
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
