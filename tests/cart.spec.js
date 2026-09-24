import { test, expect } from '@playwright/test';

test.describe('🛒 Cart Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('add product to cart', async ({ page }) => {
    const firstAdd = page.locator('.k-prod-add').first();
    await firstAdd.click();
    await expect(page.locator('#k-cart-badge')).toContainText('1');
  });

  test('cart drawer opens', async ({ page }) => {
    await page.locator('.k-prod-add').first().click();
    await page.locator('#k-cart-btn').click();
    await expect(page.locator('#k-drawer.open')).toBeVisible();
  });

  test('quantity update works', async ({ page }) => {
    await page.locator('.k-prod-add').first().click();
    await page.locator('#k-cart-btn').click();
    
    const plusBtn = page.locator('#drawer-body button:has-text("+")').first();
    await plusBtn.click();
    await expect(page.locator('#k-cart-badge')).toContainText('2');
  });

  test('remove product works', async ({ page }) => {
    await page.locator('.k-prod-add').first().click();
    await page.locator('#k-cart-btn').click();
    await page.locator('#drawer-body button:has-text("حذف")').first().click();
    await expect(page.locator('#drawer-body .k-empty')).toBeVisible();
  });
});