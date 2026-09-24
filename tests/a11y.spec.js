import { test, expect } from '@playwright/test';

test.describe('♿ Accessibility', () => {
  test('all images have alt text', async ({ page }) => {
    await page.goto('/');
    const images = await page.locator('img').all();
    for(const img of images){
      const alt = await img.getAttribute('alt');
      expect(alt, 'Image missing alt').toBeTruthy();
    }
  });

  test('buttons have labels', async ({ page }) => {
    await page.goto('/');
    const buttons = await page.locator('button.k-icon-btn').all();
    for(const btn of buttons){
      const aria = await btn.getAttribute('aria-label');
      const title = await btn.getAttribute('title');
      expect(aria || title).toBeTruthy();
    }
  });

  test('page has main landmark', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('main#k-main')).toBeVisible();
  });

  test('focus visible on tab navigation', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'INPUT']).toContain(focused);
  });
});