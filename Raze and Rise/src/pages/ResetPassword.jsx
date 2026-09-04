import { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import styles from './AuthPage.module.css'

/**
 * Shown when the user arrives on a password-recovery link.
 *
 * The recovery redirect already carries a valid session (supabase-js picks the
 * tokens out of the URL hash), so updateUser() is authenticated here. Without
 * this screen a recovery link would silently drop the user into the app with
 * their old, forgotten password still set.
 */
export default function ResetPassword({ onDone }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const submit = async e => {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError('Those passwords do not match.')
      return
    }
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) setError(error.message)
    else onDone()
  }

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <h1 className={styles.title}>Raze &amp; Rise</h1>
        <p className={styles.subtitle}>Choose a new password</p>

        <form onSubmit={submit} className={styles.form}>
          <input
            className={styles.input}
            type="password"
            placeholder="New password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            minLength={6}
          />
          <input
            className={styles.input}
            type="password"
            placeholder="Confirm new password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
            autoComplete="new-password"
            minLength={6}
          />

          {error && <p className={styles.error}>{error}</p>}

          <button className={styles.btn} type="submit" disabled={busy}>
            {busy ? '…' : 'Save Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
