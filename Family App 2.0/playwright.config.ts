import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright runs against either:
 *   - a deployed Vercel preview (CI / staging) — set PLAYWRIGHT_BASE_URL
 *   - a local dev server (default) — auto-started via webServer
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: process.env['PLAYWRIGHT_BASE_URL'] ?? 'http://localhost:5173',
    headless: true,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env['PLAYWRIGHT_BASE_URL']
    ? undefined
    : {
        command: 'npm run dev',
        port: 5173,
        reuseExistingServer: !process.env['CI'],
        timeout: 120_000,
      },
});
