import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test.describe('CRUD smoke', () => {
  test('primary navigation is visible', async ({ page }) => {
    await expect(page.getByRole('navigation', { name: /primary/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /booster/i })).toBeVisible();
  });

  test('creates an item and opens about', async ({ page }) => {
    await page.getByLabel('Title').fill('Playwright item');
    await page.getByLabel('Notes').fill('from e2e');
    await page.getByRole('button', { name: /add item/i }).click();
    await expect(page.getByRole('list', { name: /items/i })).toContainText('Playwright item');

    await page.getByRole('link', { name: /about/i }).click();
    await expect(page).toHaveURL(/\/about/);
    await expect(page.getByRole('heading', { name: /about this booster seat/i })).toBeVisible();
  });
});
