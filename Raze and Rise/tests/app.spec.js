import { test, expect } from '@playwright/test'
import { mockAuth, skipLoadingScreen } from './helpers.js'

// Onboarded state so the onboarding modal doesn't block navigation tests
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

test.describe('Authenticated app', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.install()
  })

  test('shows the nav and dashboard after loading screen', async ({ page }) => {
    await mockAuth(page, ONBOARDED_STATE)
    await page.goto('/')
    await skipLoadingScreen(page)

    await expect(page.getByText('Raze & Rise').first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Workouts' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Split' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Progress' })).toBeVisible()
  })

  test('can navigate to the Workouts tab', async ({ page }) => {
    await mockAuth(page, ONBOARDED_STATE)
    await page.goto('/')
    await skipLoadingScreen(page)

    await page.getByRole('button', { name: 'Workouts' }).click()
    await expect(page.locator('main')).toBeVisible()
  })

  test('can navigate to the Split tab', async ({ page }) => {
    await mockAuth(page, ONBOARDED_STATE)
    await page.goto('/')
    await skipLoadingScreen(page)

    await page.getByRole('button', { name: 'Split' }).click()
    await expect(page.locator('main')).toBeVisible()
  })

  test('can navigate to the Progress tab', async ({ page }) => {
    await mockAuth(page, ONBOARDED_STATE)
    await page.goto('/')
    await skipLoadingScreen(page)

    await page.getByRole('button', { name: 'Progress' }).click()
    await expect(page.locator('main')).toBeVisible()
  })

  test('shows onboarding for a new user', async ({ page }) => {
    await mockAuth(page, null) // null = no saved state → defaultState → onboarded:false
    await page.goto('/')
    await skipLoadingScreen(page)

    await expect(page.getByText('First-time setup')).toBeVisible()
    await expect(page.getByText('Choose your training split')).toBeVisible()
  })

  test('user email is shown in the nav', async ({ page }) => {
    await mockAuth(page, ONBOARDED_STATE)
    await page.goto('/')
    await skipLoadingScreen(page)

    await expect(page.getByText('test@example.com')).toBeVisible()
  })
})
