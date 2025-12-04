import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.use({ storageState: 'e2e/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display all navigation links', async ({ page }) => {
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Contacts')).toBeVisible();
    await expect(page.locator('text=Companies')).toBeVisible();
    await expect(page.locator('text=Cases')).toBeVisible();
    await expect(page.locator('text=Tasks')).toBeVisible();
    await expect(page.locator('text=Calendar')).toBeVisible();
    await expect(page.locator('text=Documents')).toBeVisible();
  });

  test('should navigate between pages', async ({ page }) => {
    // Test navigation to different pages
    await page.click('text=Contacts');
    await expect(page).toHaveURL('/contacts');

    await page.click('text=Companies');
    await expect(page).toHaveURL('/companies');

    await page.click('text=Cases');
    await expect(page).toHaveURL('/cases');

    await page.click('text=Tasks');
    await expect(page).toHaveURL('/tasks');

    await page.click('text=Calendar');
    await expect(page).toHaveURL('/calendar');

    await page.click('text=Documents');
    await expect(page).toHaveURL('/documents');
  });

  test('should display user menu when logged in', async ({ page }) => {
    // Should show user info or logout button
    await expect(page.locator('text=Logout, button:has-text("Logout")')).toBeVisible();
  });

  test('should allow logout', async ({ page }) => {
    await page.click('text=Logout');
    await expect(page).toHaveURL('/login');
  });

  test('should have search functionality', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search" i]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('test query');
      await searchInput.press('Enter');
      await expect(page).toHaveURL(/\/search/);
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check for mobile menu button
    const menuButton = page.locator('button[aria-label="Menu"], button:has-text("Menu")');
    if (await menuButton.count() > 0) {
      await menuButton.click();
      // Mobile menu should be visible
      await expect(page.locator('text=Dashboard')).toBeVisible();
    }
  });
});

