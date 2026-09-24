import { test, expect } from '@playwright/test';

test.describe('📱 Responsive', () => {
  test('mobile shows bottom nav', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await expect(page.locator('.k-bottom')).toBeVisible();
  });

  test('desktop hides bottom nav', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect(page.locator('.k-bottom')).not.toBeVisible();
  });

  test('sidebar hides on mobile in admin', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/admin.html');
    await expect(page.locator('#sidebar')).not.toBeInViewport();
  });
});