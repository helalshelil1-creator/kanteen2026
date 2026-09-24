import { test, expect } from '@playwright/test';

test.describe('🏠 Homepage', () => {
  test('loads correctly and shows hero', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/كانتِين|Kanteen/);
    await expect(page.locator('.k-hero')).toBeVisible();
    await expect(page.locator('.k-hero-tag')).toContainText('توصيل');
  });

  test('logo displays', async ({ page }) => {
    await page.goto('/');
    const logo = page.locator('.k-logo-img').first();
    await expect(logo).toBeVisible();
  });

  test('hero CTA opens stores modal', async ({ page }) => {
    await page.goto('/');
    await page.locator('.k-hero-cta').click();
    await expect(page.locator('.kt-store-modal.open')).toBeVisible({ timeout: 5000 });
  });

  test('header displays all action buttons', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#k-theme-btn')).toBeVisible();
    await expect(page.locator('#k-lang-btn')).toBeVisible();
    await expect(page.locator('#k-notif-btn')).toBeVisible();
    await expect(page.locator('#k-wish-btn')).toBeVisible();
    await expect(page.locator('#k-cart-btn')).toBeVisible();
    await expect(page.locator('#k-user-btn')).toBeVisible();
  });

  test('categories load', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.k-cat')).toHaveCount(10);
  });

  test('products display on homepage', async ({ page }) => {
    await page.goto('/');
    const products = page.locator('.k-prod');
    await expect(products.first()).toBeVisible();
    expect(await products.count()).toBeGreaterThan(4);
  });
});