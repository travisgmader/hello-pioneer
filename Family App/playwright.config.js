import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: 1,
  use: {
    baseURL: 'https://family-hub-amber.vercel.app',
    storageState: 'tests/.auth/session.json',
    headless: false,
    viewport: { width: 1280, height: 800 },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  globalSetup: './tests/global-setup.js',
  projects: [{ name: 'chromium', use: { channel: 'chromium' } }],
});
