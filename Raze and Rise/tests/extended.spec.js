import { test, expect } from '@playwright/test'
import { mockAuth, skipLoadingScreen, SUPABASE_URL } from './helpers.js'

const ONBOARDED_STATE = {
  onboarded: true,
  settings: { split: 'ppl', hybridSequence: ['Push', 'Pull', 'Legs'], weightMethod: 'manual' },
  exerciseOrm: {},
  profile: { name: '', age: '', height: '', sex: '' },
  measurements: {},
  oneRepMax: {},
  templates: {},
  rotation: { pointer: 0 },
  session: null,
  history: [],
}

// State with no split configured — triggers "No split configured" in Dashboard
const NO_SPLIT_STATE = {
  ...ONBOARDED_STATE,
  settings: { weightMethod: 'manual' },
}

test.describe('Settings page (gear icon)', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.install()
  })

  test('gear button navigates to the Settings page', async ({ page }) => {
    await mockAuth(page, ONBOARDED_STATE)
    await page.goto('/')
    await skipLoadingScreen(page)

    await page.getByRole('button', { name: 'Settings' }).click()
    await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible()
  })

  test('Settings page shows Profile section', async ({ page }) => {
    await mockAuth(page, ONBOARDED_STATE)
    await page.goto('/')
    await skipLoadingScreen(page)

    await page.getByRole('button', { name: 'Settings' }).click()
    await expect(page.getByRole('button', { name: 'Profile' })).toBeVisible()
  })

  test('Settings page shows Weight & Measurements section', async ({ page }) => {
    await mockAuth(page, ONBOARDED_STATE)
    await page.goto('/')
    await skipLoadingScreen(page)

    await page.getByRole('button', { name: 'Settings' }).click()
    await expect(page.getByRole('button', { name: 'Weight & Measurements' })).toBeVisible()
  })

  test('Settings page shows One Rep Max section', async ({ page }) => {
    await mockAuth(page, ONBOARDED_STATE)
    await page.goto('/')
    await skipLoadingScreen(page)

    await page.getByRole('button', { name: 'Settings' }).click()
    await expect(page.getByRole('button', { name: 'One Rep Max' })).toBeVisible()
  })

  test('Settings page shows Macro Calculator section', async ({ page }) => {
    await mockAuth(page, ONBOARDED_STATE)
    await page.goto('/')
    await skipLoadingScreen(page)

    await page.getByRole('button', { name: 'Settings' }).click()
    await expect(page.getByRole('button', { name: 'Macro Calculator' })).toBeVisible()
  })

  test('Profile section expands to show form fields', async ({ page }) => {
    await mockAuth(page, ONBOARDED_STATE)
    await page.goto('/')
    await skipLoadingScreen(page)

    await page.getByRole('button', { name: 'Settings' }).click()
    await page.getByRole('button', { name: 'Profile' }).click()

    await expect(page.getByPlaceholder('5′ 10″')).toBeVisible()
  })

  test('One Rep Max section expands to show Bench Press field', async ({ page }) => {
    await mockAuth(page, ONBOARDED_STATE)
    await page.goto('/')
    await skipLoadingScreen(page)

    await page.getByRole('button', { name: 'Settings' }).click()
    await page.getByRole('button', { name: 'One Rep Max' }).click()

    await expect(page.getByText('Bench Press')).toBeVisible()
  })
})

test.describe('Split page (nav tab)', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.install()
  })

  test('Split tab shows the Split heading', async ({ page }) => {
    await mockAuth(page, ONBOARDED_STATE)
    await page.goto('/')
    await skipLoadingScreen(page)

    await page.getByRole('button', { name: 'Split' }).click()
    await expect(page.getByRole('heading', { name: 'Split', level: 1 })).toBeVisible()
  })

  test('Split page shows the split options', async ({ page }) => {
    await mockAuth(page, ONBOARDED_STATE)
    await page.goto('/')
    await skipLoadingScreen(page)

    await page.getByRole('button', { name: 'Split' }).click()
    await expect(page.getByText('Push / Pull / Legs')).toBeVisible()
  })
})

test.describe('Dashboard content', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.install()
  })

  test('shows "No split configured" when no split is set', async ({ page }) => {
    await mockAuth(page, NO_SPLIT_STATE)
    await page.goto('/')
    await skipLoadingScreen(page)

    await expect(page.getByRole('heading', { name: 'No split configured' })).toBeVisible()
  })

  test('shows missing-template message when split is set but no templates exist', async ({ page }) => {
    await mockAuth(page, ONBOARDED_STATE)
    await page.goto('/')
    await skipLoadingScreen(page)

    // PPL with no templates → "Missing template: Push"
    await expect(page.getByText(/Missing template/)).toBeVisible()
  })

  test('shows Skip to next day button when template is missing', async ({ page }) => {
    await mockAuth(page, ONBOARDED_STATE)
    await page.goto('/')
    await skipLoadingScreen(page)

    await expect(page.getByRole('button', { name: 'Skip to next day' })).toBeVisible()
  })
})

test.describe('Nav user controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.install()
  })

  test('sign out button is visible after login', async ({ page }) => {
    await mockAuth(page, ONBOARDED_STATE)
    await page.goto('/')
    await skipLoadingScreen(page)

    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()
  })

  test('sign out shows the login form', async ({ page }) => {
    await mockAuth(page, ONBOARDED_STATE)

    // Mock sign-out endpoint so it completes successfully
    await page.route(`${SUPABASE_URL}/auth/v1/logout**`, route =>
      route.fulfill({ status: 204, body: '' })
    )

    await page.goto('/')
    await skipLoadingScreen(page)

    await page.getByRole('button', { name: 'Sign out' }).click()
    await expect(page.getByPlaceholder('Email')).toBeVisible({ timeout: 5000 })
  })
})
