import { test, expect } from '@playwright/test';

test.describe('💳 Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.locator('.k-prod-add').first().click();
    await page.goto('/#/checkout');
  });

  test('checkout requires name', async ({ page }) => {
    await page.locator('button:has-text("التالي")').click();
    await expect(page.locator('.k-toast.error')).toBeVisible({ timeout: 2000 });
  });

  test('full checkout flow', async ({ page }) => {
    // Step 1
    await page.locator('#co-name').fill('أحمد محمد');
    await page.locator('#co-phone').fill('01012345678');
    await page.locator('button:has-text("التالي")').click();
    
    // Step 2
    await page.locator('#co-city').fill('القاهرة');
    await page.locator('#co-street').fill('شارع التحرير');
    await page.locator('button:has-text("التالي")').click();
    
    // Step 3 - time
    await page.locator('button:has-text("التالي")').click();
    
    // Step 4 - payment
    await page.locator('button:has-text("التالي")').click();
    
    // Step 5 - summary
    await page.locator('button:has-text("التالي")').click();
    
    // Step 6 - confirm
    await page.locator('button:has-text("تأكيد الطلب")').click();
    await expect(page).toHaveURL(/track/);
  });
});