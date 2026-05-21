import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';

test.describe('Walking Skeleton', () => {
  test('unauthenticated users see the login card', async ({ page }) => {
    await page.goto(BASE_URL + '/');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText('Family Hub')).toBeVisible();
    await expect(page.getByText("Sign in to access your family's dashboard")).toBeVisible();
    await expect(page.getByText('Sign in with Apple')).toBeVisible();
    await expect(page.getByText('Sign in with Google')).toBeVisible();
  });

  test('authenticated user reaches the app shell', async ({ page }) => {
    test.skip(!process.env.PLAYWRIGHT_GOOGLE_AUTH, 'Set PLAYWRIGHT_GOOGLE_AUTH=true with a stored auth state to run this test');
    // Uses storageState from tests/.auth/user.json (created out-of-band by manual playwright codegen run)
    await page.goto(BASE_URL + '/');
    const url = page.url();
    const isWizard = url.includes('/onboarding/create-family');
    const isDashboard = url.includes('/dashboard');
    expect(isWizard || isDashboard).toBe(true);
    if (isWizard) {
      await page.getByPlaceholder('The Mader Family').fill('Test Family');
      await page.getByRole('button', { name: '🏠' }).click();
      await page.getByRole('button', { name: 'Create my family' }).click();
    }
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    // Verify all six BottomNav tabs
    for (const emoji of ['🏠', '✅', '📅', '🍽️', '🛒', '📝']) {
      await expect(page.getByRole('button').filter({ hasText: emoji })).toBeVisible();
    }
  });
});
