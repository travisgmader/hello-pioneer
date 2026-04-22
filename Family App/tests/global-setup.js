import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const SESSION_PATH = path.join(process.cwd(), 'tests/.auth/session.json');
const CHROME_USER_DATA = path.join(process.env.HOME, 'Library/Application Support/Google/Chrome');
const CHROME_PROFILE = 'Profile 1';

export default async function globalSetup() {
  if (fs.existsSync(SESSION_PATH)) {
    console.log('✓ Reusing saved auth session');
    return;
  }

  console.log('\n⚠️  Capturing session from your existing Chrome profile...\n');

  // Launch using real Chrome with user's existing profile (already signed in)
  const browser = await chromium.launchPersistentContext(
    path.join(CHROME_USER_DATA, CHROME_PROFILE),
    {
      channel: 'chrome',
      headless: false,
      args: ['--no-first-run', '--no-default-browser-check'],
    }
  );

  const page = browser.pages()[0] || await browser.newPage();
  await page.goto('https://family-hub-amber.vercel.app');
  await page.waitForSelector('nav', { timeout: 30_000 });

  await browser.storageState({ path: SESSION_PATH });
  console.log('✓ Session captured. Running tests...\n');
  await browser.close();
}
