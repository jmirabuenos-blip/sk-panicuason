const { test, expect } = require('@playwright/test');
const fs = require('fs');
for (const file of fs.readdirSync('.').filter(f => f.endsWith('.html'))) {
  test(`mobile navigation: ${file}`, async ({ page }) => {
    await page.route('https://**/*', route => route.abort());
    await page.goto('/' + file);
    const menu = page.locator('#hamburger');
    await menu.click();
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#navLinks')).toBeVisible();
    await page.locator('.dropdown-toggle').filter({ hasText: 'Programs' }).click();
    await expect(page.locator('.dropdown-menu a[href="events.html"]')).toBeVisible();
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  });
}
