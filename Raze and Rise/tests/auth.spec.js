import { test, expect } from '@playwright/test'
import { SUPABASE_URL } from './helpers.js'

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
    await expect(page.getByText('Invalid login credentials')).toBeVisible()
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
})
