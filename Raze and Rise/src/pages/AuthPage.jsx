import { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { initialAuthError, initialAuthErrorCode } from '../lib/urlHash.js'
import styles from './AuthPage.module.css'

// Supabase returns a 200 with an empty identities array when the address is
// already registered, rather than revealing that the account exists. Detecting
// it here lets us give the real next step instead of "check your email" for a
// mail that will never arrive.
const isAlreadyRegistered = data =>
  Boolean(data?.user) && Array.isArray(data.user.identities) && data.user.identities.length === 0

const EXPIRED_LINK_COPY =
  'That confirmation link has already been used or has expired. ' +
  'Links work once, on the first device that opens them — sign in below, ' +
  'or send yourself a new one.'

export default function AuthPage() {
  const [mode, setMode] = useState('login') // 'login' | 'signup' | 'forgot'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(
    initialAuthErrorCode === 'otp_expired' ? EXPIRED_LINK_COPY : initialAuthError
  )
  const [message, setMessage] = useState(null)
  const [busy, setBusy] = useState(false)
  // Offer "resend confirmation" only once we know the address is unconfirmed.
  const [showResend, setShowResend] = useState(initialAuthErrorCode === 'otp_expired')

  const redirectTo = window.location.origin

  const submit = async e => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setBusy(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
        if (error) throw error
        // Deliberately generic: does not reveal whether the address is registered.
        setMessage('If that address has an account, a password reset link is on its way.')
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectTo },
        })
        if (error) throw error
        if (isAlreadyRegistered(data)) {
          setError(
            'That email already has an account. Sign in below, or use "Forgot password?" if you need to reset it.'
          )
          setMode('login')
        } else {
          setMessage('Check your email to confirm your account.')
        }
      }
    } catch (err) {
      // "Invalid login credentials" is returned for both a wrong password and an
      // unconfirmed address, so point at both recovery paths rather than guessing.
      if (mode === 'login' && /invalid login credentials/i.test(err.message)) {
        setError(
          'Wrong email or password — or the account is not confirmed yet. ' +
            'Use "Forgot password?" to reset it, or resend the confirmation email.'
        )
        setShowResend(true)
      } else {
        setError(err.message)
      }
    } finally {
      setBusy(false)
    }
  }

  const resendConfirmation = async () => {
    if (!email) {
      setError('Enter your email address first, then resend.')
      return
    }
    setError(null)
    setMessage(null)
    setBusy(true)
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: redirectTo },
    })
    setBusy(false)
    if (error) setError(error.message)
    else setMessage('Confirmation email sent — open it on this device.')
  }

  const go = next => () => {
    setMode(next)
    setError(null)
    setMessage(null)
  }

  const title = {
    login: 'Sign in to continue',
    signup: 'Create your account',
    forgot: 'Reset your password',
  }[mode]

  const cta = { login: 'Sign In', signup: 'Create Account', forgot: 'Send Reset Link' }[mode]

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <h1 className={styles.title}>Raze &amp; Rise</h1>
        <p className={styles.subtitle}>{title}</p>

        <form onSubmit={submit} className={styles.form}>
          <input
            className={styles.input}
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          {mode !== 'forgot' && (
            <input
              className={styles.input}
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength={6}
            />
          )}

          {error && <p className={styles.error}>{error}</p>}
          {message && <p className={styles.success}>{message}</p>}

          <button className={styles.btn} type="submit" disabled={busy}>
            {busy ? '…' : cta}
          </button>
        </form>

        {mode === 'login' && (
          <button className={styles.toggle} onClick={go('forgot')}>
            Forgot password?
          </button>
        )}

        {showResend && mode !== 'forgot' && (
          <button className={styles.toggle} onClick={resendConfirmation} disabled={busy}>
            Resend confirmation email
          </button>
        )}

        <button className={styles.toggle} onClick={go(mode === 'login' ? 'signup' : 'login')}>
          {mode === 'login'
            ? "Don't have an account? Sign up"
            : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  )
}
