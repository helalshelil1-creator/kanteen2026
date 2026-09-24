import { test, expect } from '@playwright/test';

test.describe('🔍 Search', () => {
  test('search input filters products', async ({ page }) => {
    await page.goto('/#/search');
    const input = page.locator('.k-search input').first();
    await input.fill('أرز');
    await input.press('Enter');
    await expect(page).toHaveURL(/q=/);
  });

  test('category filter works', async ({ page }) => {
    await page.goto('/#/search');
    const catRadio = page.locator('input[name="cat"]').nth(1);
    await catRadio.click();
    await expect(page).toHaveURL(/cat=/);
  });

  test('deals filter shows only discounted', async ({ page }) => {
    await page.goto('/#/search?deals=1');
    const badges = page.locator('.k-prod-tag');
    await expect(badges.first()).toBeVisible();
  });
});