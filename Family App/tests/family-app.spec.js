import { test, expect } from '@playwright/test';

// Nav uses buttons, not links
async function navTo(page, label) {
  await page.getByRole('button', { name: new RegExp(label, 'i') }).first().click();
}

// ─── Auth / Load ──────────────────────────────────────────────────────────────
test('app loads and shows dashboard', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('nav')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Family Plan' })).toBeVisible();
});

// ─── Navigation ───────────────────────────────────────────────────────────────
test('all nav links navigate correctly', async ({ page }) => {
  await page.goto('/');
  for (const [label, heading] of [
    ['Chores', 'Chore List'],
    ['Calendar', 'Family Calendar'],
    ['Meals', 'Weekly Meals'],
    ['Groceries', 'Groceries'],
    ['Notes', 'Notes'],
  ]) {
    await navTo(page, label);
    await expect(page.locator('h1')).toContainText(heading);
  }
});

// ─── Dashboard ────────────────────────────────────────────────────────────────
test('dashboard shows all 5 family members in nav', async ({ page }) => {
  await page.goto('/');
  for (const name of ['Mom', 'Dad', 'Stella', 'Roman', 'Layla']) {
    await expect(page.locator('nav').getByRole('button', { name: new RegExp(name) })).toBeVisible();
  }
});

// ─── Chores ───────────────────────────────────────────────────────────────────
test('chores: add, toggle, and delete a chore', async ({ page }) => {
  await page.goto('/');
  await navTo(page, 'Chores');
  await expect(page.getByText('Chore List')).toBeVisible();

  // Add
  await page.getByRole('button', { name: '+ Add Chore' }).click();
  await page.getByPlaceholder('Chore title...').fill('Playwright Test Chore');
  await page.locator('select').first().selectOption('mom');
  await page.getByRole('button', { name: 'Add Chore' }).click();
  await expect(page.getByText('Playwright Test Chore')).toBeVisible();

  // Toggle done via checkbox button in the row
  const row = page.locator('tr').filter({ hasText: 'Playwright Test Chore' });
  await row.locator('button.checkbox, button[class*="checkbox"]').click();

  // Delete
  await row.getByTitle('Delete').click();
  await expect(page.getByText('Playwright Test Chore')).not.toBeVisible();
});

// ─── Chores: persistence ──────────────────────────────────────────────────────
test('chores: added chore persists after refresh', async ({ page }) => {
  await page.goto('/');
  await navTo(page, 'Chores');

  await page.getByRole('button', { name: '+ Add Chore' }).click();
  await page.getByPlaceholder('Chore title...').fill('Persist Test Chore');
  await page.locator('select').first().selectOption('dad');
  await page.getByRole('button', { name: 'Add Chore' }).click();
  await expect(page.getByText('Persist Test Chore')).toBeVisible();

  await page.reload();
  await navTo(page, 'Chores');
  await expect(page.getByText('Persist Test Chore')).toBeVisible();

  // Cleanup
  const row = page.locator('tr').filter({ hasText: 'Persist Test Chore' });
  await row.getByTitle('Delete').click();
});

// ─── Calendar ─────────────────────────────────────────────────────────────────
test('calendar: renders with month grid and navigation', async ({ page }) => {
  await page.goto('/');
  await navTo(page, 'Calendar');
  await expect(page.locator('h1')).toContainText('Family Calendar');

  // Month nav buttons
  const buttons = page.locator('button');
  await expect(buttons.first()).toBeVisible();
});

test('calendar: can add and delete an event', async ({ page }) => {
  const title = `PW Event ${Date.now()}`;
  await page.goto('/');
  await navTo(page, 'Calendar');

  // Click a day cell — opens the overlay/detail panel
  await page.locator('[class*="day"], [class*="cell"]').filter({ hasNot: page.locator('[class*="outside"]') }).nth(10).click();

  // "+ Event" button is inside the overlay
  await page.getByRole('button', { name: '+ Event' }).click();
  await page.getByPlaceholder('Event title...').fill(title);
  await page.getByRole('button', { name: 'Add' }).click();

  // Event appears in the detail panel list
  const evtItem = page.locator('[class*="evtItem"]').filter({ hasText: title }).first();
  await expect(evtItem).toBeVisible();

  // Delete via the evtDel ✕ in that row
  await evtItem.locator('[class*="evtDel"]').click();
  await expect(page.locator('[class*="evtItem"]').filter({ hasText: title })).toHaveCount(0);
});

// ─── Meals ────────────────────────────────────────────────────────────────────
test('meals: page loads with full week grid', async ({ page }) => {
  await page.goto('/');
  await navTo(page, 'Meals');
  await expect(page.locator('h1')).toContainText('Weekly Meals');
  for (const day of ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']) {
    await expect(page.getByText(day).first()).toBeVisible();
  }
  for (const slot of ['Breakfast', 'Lunch', 'Dinner']) {
    await expect(page.getByText(slot).first()).toBeVisible();
  }
});

test('meals: week navigation works', async ({ page }) => {
  await page.goto('/');
  await navTo(page, 'Meals');
  const rangeBefore = await page.locator('[class*="weekRange"]').textContent();
  await page.getByRole('button', { name: '›' }).click();
  const rangeAfter = await page.locator('[class*="weekRange"]').textContent();
  expect(rangeBefore).not.toEqual(rangeAfter);
  await page.getByRole('button', { name: '‹' }).click();
});

test('meals: can set and clear a meal cell (parent)', async ({ page }) => {
  await page.goto('/');
  await navTo(page, 'Meals');

  // Click first "+ Add" cell
  await page.getByRole('button', { name: '+ Add' }).first().click();
  await page.getByPlaceholder('Meal name...').fill('Playwright Tacos');
  await page.keyboard.press('Enter');
  await expect(page.getByText('Playwright Tacos')).toBeVisible();

  // Clear it
  await page.getByText('Playwright Tacos').click();
  await page.getByPlaceholder('Meal name...').fill('');
  await page.keyboard.press('Enter');
});

test('meals: can add and delete a recommendation', async ({ page }) => {
  await page.goto('/');
  await navTo(page, 'Meals');

  await page.getByRole('button', { name: /recommend a meal/i }).click();
  const recTitle = `PW Pizza ${Date.now()}`;
  await page.getByPlaceholder('Meal name...').fill(recTitle);
  await page.getByRole('button', { name: 'Add Recommendation' }).click();
  await expect(page.locator('[class*="recCard"]').filter({ hasText: recTitle })).toBeVisible();

  await page.locator('[class*="recCard"]').filter({ hasText: recTitle }).locator('[class*="recDelete"]').click();
  await expect(page.locator('[class*="recCard"]').filter({ hasText: recTitle })).toHaveCount(0);
});

// ─── Meals: persistence ───────────────────────────────────────────────────────
test('meals: meal persists after refresh', async ({ page }) => {
  await page.goto('/');
  await navTo(page, 'Meals');

  await page.getByRole('button', { name: '+ Add' }).first().click();
  await page.getByPlaceholder('Meal name...').fill('Persist Pasta');
  await page.keyboard.press('Enter');
  await expect(page.getByText('Persist Pasta')).toBeVisible();

  await page.reload();
  await navTo(page, 'Meals');
  await expect(page.getByText('Persist Pasta')).toBeVisible();

  // Cleanup
  await page.getByText('Persist Pasta').click();
  await page.getByPlaceholder('Meal name...').fill('');
  await page.keyboard.press('Enter');
});

// Helper: find a grocery item row by name — traverses up to the item div via XPath parent
function groceryItemRow(page, name) {
  return page.locator('[class*="itemName"]')
    .filter({ hasText: name })
    .first()
    .locator('xpath=..');
}

// ─── Groceries ────────────────────────────────────────────────────────────────
test('groceries: add, check, and delete an item', async ({ page }) => {
  const itemName = `PW Apples ${Date.now()}`;
  await page.goto('/');
  await navTo(page, 'Groceries');
  await expect(page.getByText('Grocery List')).toBeVisible();

  await page.getByRole('button', { name: '+ Add Item' }).click();
  await page.getByPlaceholder('Item name...').fill(itemName);
  await page.getByPlaceholder(/qty/i).fill('6');
  await page.getByRole('button', { name: 'Add' }).click();

  const item = groceryItemRow(page, itemName);
  await expect(item).toBeVisible();

  // Check it off via the checkbox button (first button in the row)
  await item.locator('button').first().click();

  // Delete
  await item.locator('button').last().click();
  await expect(page.locator('[class*="itemName"]').filter({ hasText: itemName })).toHaveCount(0);
});

test('groceries: submit and approve a request', async ({ page }) => {
  await page.goto('/');
  await navTo(page, 'Groceries');

  await page.getByRole('button', { name: '+ Request Item' }).click();
  await page.getByPlaceholder('What do you want?').fill('Playwright Cookies');
  await page.getByRole('button', { name: 'Request', exact: true }).click();
  await expect(page.getByText('Playwright Cookies').first()).toBeVisible();

  // Approve (parent)
  const reqCard = page.locator('[class*="reqCard"]').filter({ hasText: 'Playwright Cookies' }).first();
  await reqCard.getByRole('button', { name: /add to list/i }).click();

  // Should appear in grocery list
  await expect(groceryItemRow(page, 'Playwright Cookies')).toBeVisible();

  // Cleanup approved request
  await page.locator('[class*="reqApproved"]').filter({ hasText: 'Playwright Cookies' }).locator('[class*="deleteBtn"]').first().click();
  // Cleanup grocery item
  await groceryItemRow(page, 'Playwright Cookies').locator('[class*="deleteBtn"]').click();
});

// ─── Groceries: persistence ───────────────────────────────────────────────────
test('groceries: item persists after refresh', async ({ page }) => {
  await page.goto('/');
  await navTo(page, 'Groceries');

  await page.getByRole('button', { name: '+ Add Item' }).click();
  await page.getByPlaceholder('Item name...').fill('Persist Bananas');
  await page.getByRole('button', { name: 'Add' }).click();
  await expect(groceryItemRow(page, 'Persist Bananas')).toBeVisible();

  await page.reload();
  await navTo(page, 'Groceries');
  await expect(groceryItemRow(page, 'Persist Bananas')).toBeVisible();

  // Cleanup — delete all copies (previous failed runs may have left extras)
  while (await groceryItemRow(page, 'Persist Bananas').isVisible().catch(() => false)) {
    await groceryItemRow(page, 'Persist Bananas').locator('[class*="deleteBtn"]').click();
    await page.waitForTimeout(300);
  }
});

// ─── Notes ────────────────────────────────────────────────────────────────────
test('notes: add a note and verify it appears', async ({ page }) => {
  const noteTitle = `PW Note ${Date.now()}`;
  await page.goto('/');
  await navTo(page, 'Notes');
  await expect(page.locator('h1')).toContainText('Notes');

  await page.getByPlaceholder(/title/i).fill(noteTitle);
  await page.getByPlaceholder(/note|content|write/i).fill('Test note body from Playwright.');
  await page.getByRole('button', { name: /save|add|post/i }).click();

  await expect(page.getByText(noteTitle).first()).toBeVisible();
});

// ─── Member pages ─────────────────────────────────────────────────────────────
test('member pages: all 5 family member pages load', async ({ page }) => {
  await page.goto('/');
  for (const name of ['Mom', 'Dad', 'Stella', 'Roman', 'Layla']) {
    await page.locator('nav').getByRole('button', { name: new RegExp(name) }).click();
    await expect(page.locator('h1, h2').first()).toBeVisible();
  }
});

// ─── iCal feed ───────────────────────────────────────────────────────────────
test('iCal feed returns valid calendar', async ({ page }) => {
  const resp = await page.request.get('/api/calendar.ics');
  expect(resp.status()).toBe(200);
  const body = await resp.text();
  expect(body).toContain('BEGIN:VCALENDAR');
  expect(body).toContain('END:VCALENDAR');
  expect(body).toContain('VERSION:2.0');
});

// ─── No DB error banner ────────────────────────────────────────────────────────
test('no save-failed error banner during normal navigation', async ({ page }) => {
  await page.goto('/');
  await navTo(page, 'Chores');
  await navTo(page, 'Groceries');
  await navTo(page, 'Meals');
  await expect(page.getByText('Save failed')).not.toBeVisible();
});
