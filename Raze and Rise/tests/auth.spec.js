import { test, expect } from '@playwright/test'
import { SUPABASE_URL, FAKE_USER } from './helpers.js'

test.describe('Auth page', () => {
  test('renders the login form', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toContainText('Raze & Rise')
    await expect(page.getByPlaceholder('Email')).toBeVisible()
    await expect(page.getByPlaceholder('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
  })

  test('toggles to sign-up mode', async ({ page }) => {
    await page.goto('/')
    await page.getByText("Don't have an account?").click()
    await expect(page.getByText('Create your account')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible()
  })

  test('toggles back to login mode', async ({ page }) => {
    await page.goto('/')
    await page.getByText("Don't have an account?").click()
    await page.getByText('Already have an account?').click()
    await expect(page.getByText('Sign in to continue')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
  })

  test('shows an error on invalid credentials', async ({ page }) => {
    await page.route(`${SUPABASE_URL}/auth/v1/token**`, route =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid login credentials' }),
      })
    )
    await page.goto('/')
    await page.getByPlaceholder('Email').fill('bad@example.com')
    await page.getByPlaceholder('Password').fill('wrongpass')
    await page.getByRole('button', { name: 'Sign In' }).click()
    // The raw "Invalid login credentials" is replaced with copy that names both
    // causes (wrong password / unconfirmed account) and both recovery paths.
    await expect(page.getByText(/Wrong email or password/)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Resend confirmation email' })).toBeVisible()
  })

  test('shows a success message after sign-up', async ({ page }) => {
    await page.route(`${SUPABASE_URL}/auth/v1/signup**`, route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'new-user', email: 'new@example.com', confirmation_sent_at: new Date().toISOString() }),
      })
    )
    await page.goto('/')
    await page.getByText("Don't have an account?").click()
    await page.getByPlaceholder('Email').fill('new@example.com')
    await page.getByPlaceholder('Password').fill('password123')
    await page.getByRole('button', { name: 'Create Account' }).click()
    await expect(page.getByText('Check your email')).toBeVisible()
  })

  test('offers a forgot-password path from the login form', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('button', { name: 'Forgot password?' })).toBeVisible()
  })

  test('sends a reset link with a generic, non-enumerating message', async ({ page }) => {
    await page.route(`${SUPABASE_URL}/auth/v1/recover**`, route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
    )
    await page.goto('/')
    await page.getByRole('button', { name: 'Forgot password?' }).click()
    await expect(page.getByText('Reset your password')).toBeVisible()
    // Password field is irrelevant when asking for a reset link.
    await expect(page.getByPlaceholder('Password')).toHaveCount(0)

    await page.getByPlaceholder('Email').fill('someone@example.com')
    await page.getByRole('button', { name: 'Send Reset Link' }).click()
    await expect(page.getByText(/If that address has an account/)).toBeVisible()
  })

  test('tells a already-registered signup to sign in instead of waiting for mail', async ({ page }) => {
    // Supabase obfuscates an existing address as a 200 with empty identities.
    await page.route(`${SUPABASE_URL}/auth/v1/signup**`, route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...FAKE_USER, identities: [] }),
      })
    )
    await page.goto('/')
    await page.getByText("Don't have an account?").click()
    await page.getByPlaceholder('Email').fill('existing@example.com')
    await page.getByPlaceholder('Password').fill('password123')
    await page.getByRole('button', { name: 'Create Account' }).click()

    await expect(page.getByText(/already has an account/)).toBeVisible()
    await expect(page.getByText('Check your email')).toHaveCount(0)
    // and drops them back on the sign-in form
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
  })

  test('explains an expired confirmation link instead of a bare login form', async ({ page }) => {
    await page.goto('/#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired')
    await expect(page.getByText(/already been used or has expired/)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Resend confirmation email' })).toBeVisible()
  })
})

test.describe('Password recovery', () => {
  test('a recovery link lands on the set-a-new-password screen', async ({ page }) => {
    await page.route(`${SUPABASE_URL}/auth/v1/user**`, route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(FAKE_USER) })
    )
    await page.route(`${SUPABASE_URL}/rest/v1/user_state*`, route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: 'null' })
    )

    await page.goto('/#access_token=fake-access-token&refresh_token=fake-refresh-token&expires_in=3600&token_type=bearer&type=recovery')

    // Signed in by the link, but gated on setting a new password rather than
    // being dropped into the app with the forgotten one still active.
    await expect(page.getByText('Choose a new password')).toBeVisible()
    await expect(page.getByPlaceholder('New password', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Save Password' })).toBeVisible()
  })

  test('rejects a mismatched confirmation', async ({ page }) => {
    await page.route(`${SUPABASE_URL}/auth/v1/user**`, route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(FAKE_USER) })
    )
    await page.route(`${SUPABASE_URL}/rest/v1/user_state*`, route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: 'null' })
    )

    await page.goto('/#access_token=fake-access-token&refresh_token=fake-refresh-token&expires_in=3600&token_type=bearer&type=recovery')
    await page.getByPlaceholder('New password', { exact: true }).fill('newpassword1')
    await page.getByPlaceholder('Confirm new password').fill('newpassword2')
    await page.getByRole('button', { name: 'Save Password' }).click()
    await expect(page.getByText('Those passwords do not match.')).toBeVisible()
  })
})
