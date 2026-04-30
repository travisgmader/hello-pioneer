import { chromium } from '@playwright/test';
import fs from 'fs';
import os from 'os';
import path from 'path';

const SESSION_PATH = path.join(process.cwd(), 'tests/.auth/session.json');

export default async function globalSetup() {
  if (fs.existsSync(SESSION_PATH)) {
    console.log('✓ Reusing saved auth session');
    return;
  }

  console.log('\n⚠️  A Chrome window will open. Sign in with Google, then tests start automatically.\n');

  const tmpProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-chrome-'));

  const context = await chromium.launchPersistentContext(tmpProfile, {
    channel: 'chrome',
    headless: false,
    // Hide automation signals so Google OAuth doesn't block login
    ignoreDefaultArgs: ['--enable-automation'],
    args: [
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-blink-features=AutomationControlled',
    ],
  });

  const page = context.pages()[0] || await context.newPage();

  // Mask navigator.webdriver before any navigation
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  await page.goto('https://family-hub-amber.vercel.app');

  console.log('   Waiting for you to sign in (up to 2 minutes)...\n');
  await page.waitForSelector('nav', { timeout: 120_000 });

  fs.mkdirSync(path.dirname(SESSION_PATH), { recursive: true });
  await context.storageState({ path: SESSION_PATH });
  console.log('✓ Session captured. Running tests...\n');
  await context.close();
}
