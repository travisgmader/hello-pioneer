import { test, expect } from '@playwright/test';

test.describe('Walking Skeleton', () => {
  test('login page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Family Hub/);
  });

  test('shows login UI at /login', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('button, [role="button"]')).toBeVisible();
  });

  test('unauthenticated redirect goes to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/(login|$)/);
  });
});
